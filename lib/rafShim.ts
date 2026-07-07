/**
 * Dev-шим: в скрытой вкладке Chrome замораживает requestAnimationFrame,
 * из-за чего R3F/GSAP не могут сделать ни одного кадра при headless-проверках.
 * Даём setTimeout-фолбэк: колбэк выполняется один раз — либо от rAF,
 * либо от таймера, смотря что придёт раньше. В production не подключается.
 */
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const native = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    let done = false;
    const run = (t: number) => {
      if (done) return;
      done = true;
      cb(t);
    };
    const id = native(run);
    setTimeout(() => run(performance.now()), 60);
    return id;
  };
}

export {};
