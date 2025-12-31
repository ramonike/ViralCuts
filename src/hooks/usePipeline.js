import { useCallback } from "react";
import { uploadToOpus, checkProjectStatus, getClips, createProjectFromUrl } from "../api/opus";

/**
 * Hook para gerenciar pipeline de jobs do Opus
 * @param {Object} state - Estado global
 * @param {Function} setState - Função para atualizar estado
 */
export function usePipeline(state, setState) {
    const pipeline = state.pipeline;
    const opusApiKey = state.settings?.opusApiKey;

    const startOpusJob = useCallback(async (input) => {
        try {
            let project;
            if (typeof input === 'string') {
                project = await createProjectFromUrl(input, opusApiKey);
            } else {
                project = await uploadToOpus(input, opusApiKey);
            }

            setState(prev => ({
                ...prev,
                pipeline: {
                    ...prev.pipeline,
                    jobs: [project, ...prev.pipeline.jobs]
                }
            }));
            
            return project;
        } catch (e) {
            console.error("Opus upload failed", e);
            throw e;
        }
    }, [opusApiKey, setState]);

    const checkOpusJob = useCallback(async (jobId) => {
        const job = pipeline.jobs.find(j => j.projectId === jobId);
        if (!job) return;

        try {
            const statusData = await checkProjectStatus(jobId, opusApiKey);

            let clips = [];
            if (statusData.status === "done") {
                clips = await getClips(jobId, opusApiKey);
            }

            setState(prev => ({
                ...prev,
                pipeline: {
                    ...prev.pipeline,
                    jobs: prev.pipeline.jobs.map(j =>
                        j.projectId === jobId
                            ? { ...j, status: statusData.status, clips: clips.length ? clips : j.clips }
                            : j
                    )
                }
            }));
        } catch (e) {
            console.error("Opus check failed", e);
        }
    }, [pipeline.jobs, opusApiKey, setState]);

    const removeOpusJob = useCallback((projectId) => {
        setState(prev => ({
            ...prev,
            pipeline: {
                ...prev.pipeline,
                jobs: prev.pipeline.jobs.filter(j => j.projectId !== projectId)
            }
        }));
    }, [setState]);

    const getJobById = useCallback((jobId) => {
        return pipeline.jobs.find(j => j.projectId === jobId);
    }, [pipeline.jobs]);

    const getPendingJobs = useCallback(() => {
        return pipeline.jobs.filter(j => j.status === 'pending' || j.status === 'processing');
    }, [pipeline.jobs]);

    const getCompletedJobs = useCallback(() => {
        return pipeline.jobs.filter(j => j.status === 'done');
    }, [pipeline.jobs]);

    return {
        pipeline,
        jobs: pipeline.jobs,
        startOpusJob,
        checkOpusJob,
        removeOpusJob,
        getJobById,
        getPendingJobs,
        getCompletedJobs
    };
}
