export function startMemoryLogger(interval = 3000) {
  setInterval(() => {
    const mem = process.memoryUsage();
    console.log("[MEMORY]", {
      rss: Math.round(mem.rss / 1024 / 1024) + "MB",
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024) + "MB",
    });
  }, interval);
}
