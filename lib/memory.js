const v8 = require('v8');
function toFixedNumber(num, digits, base){
    const pow = Math.pow(base ?? 10, digits);
    return Math.round(num*pow) / pow;
}
function bytesToMB(b){
    return toFixedNumber(b/1024/1024, 2, 10);
}
function stats(){

    try{
        let h = v8.getHeapStatistics()
        return {
            "total_heap_size": bytesToMB(h.total_heap_size),
            "total_heap_size_executable": bytesToMB(h.total_heap_size_executable),
            "total_physical_size": bytesToMB(h.total_physical_size),
            "total_available_size": bytesToMB(h.total_available_size),
            "used_heap_size": bytesToMB(h.used_heap_size),
            "heap_size_limit": bytesToMB(h.heap_size_limit),
            "malloced_memory": bytesToMB(h.malloced_memory),
            "peak_malloced_memory": bytesToMB(h.peak_malloced_memory),
            "does_zap_garbage": h.does_zap_garbage,
            "number_of_native_contexts": h.number_of_native_contexts,
            "number_of_detached_contexts": h.number_of_detached_contexts,
        }
    } catch (err){
        return {};
    }
}

export {
    stats
};
