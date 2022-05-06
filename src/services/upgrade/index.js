import { jobListLabel, runUpgradeJob } from './run-upgrade-job'
import { Logger } from '../../logger'
import { waitForJobToComplete } from '../../utils/job-waiter'
import { k8sAppsV1Api, k8sCoreV1Api } from '../k8s/k8s'
import { k8sConfig } from '../../config/k8s-config'
import * as k8s from '@kubernetes/client-node'
import { blContainers } from '../bl-containers'
import { listPods } from '../k8s/k8s-list-pods'

const logger = Logger('UpgradeService')

class UpgradeService {
    async upgrade({ version }) {
        const result = await runUpgradeJob({ version })
        const jobName = result.response.body.metadata.name

        const jobPods = await k8sCoreV1Api.listNamespacedPod(await k8sConfig.getNamespace(), false, true, '', '', `upgradeJobName=${jobName}`)
        logger.info('job started\n\n')

        const jobPod = jobPods.body.items[0]
        logger.verbose(`upgrade job pod is ${JSON.stringify(jobPod)}`)

        setImmediate(() => this._waitJobCompleteAndUpgradeServices(version, jobName))

        return {
            jobName: jobName,
            podName: jobPod.metadata.name,
            creationTimestamp: jobPod.metadata.creationTimestamp
        }
    }

    async _waitJobCompleteAndUpgradeServices(version, jobName) {
        try {
            await waitForJobToComplete(jobName)
            logger.info('upgrade job completed')

            const containers = Object.entries(blContainers.bl)
                .filter(([key, container]) => container !== blContainers.bl.initConfigValues)
                .map(([key, container]) => container)

            for (const container of containers) {
                logger.info(`upgrading ${container.name} to ${container.imageName}:${version}`)
                const result = await this._upgradeVersion(container.name, container.imageName, version)
                logger.info(`upgrade version for ${container.imageName} result is ${JSON.stringify(result)}`)
            }

        } catch (err) {
            logger.error(`Run upgrade job failed with error: ${JSON.stringify(err)}`)
        }
    }

    async _upgradeVersion(serviceName, imageName, version) {
        const body = {
            'spec': {
                'template': {
                    'spec': {

                        'containers': [{
                            'image': `backendless/${imageName}:${version}`,
                            'name': serviceName
                        }]
                    }
                }
            }
        }
        const options = { 'headers': { 'Content-type': k8s.PatchUtils.PATCH_FORMAT_STRATEGIC_MERGE_PATCH } }
        return await k8sAppsV1Api.patchNamespacedStatefulSet(serviceName, await k8sConfig.getNamespace(), body,
            undefined, undefined, undefined, undefined, options)
    }

    async getJobs() {
        const pods = (await listPods(jobListLabel, true)).body.items
        return pods.map(pod => {
            return {
                jobName: pod.metadata.labels['job-name'],
                podName: pod.metadata.name,
                creationTimestamp: pod.metadata.creationTimestamp,
                version: pod.spec.containers[0].image.split(':')[1]
            }
        }).sort((job1, job2) => {
            return new Date(job2.creationTimestamp).getTime() - new Date(job1.creationTimestamp).getTime()
        })
    }
}


export const upgradeService = new UpgradeService()