(function() {
  const PLOT_WIDTH = 2000;
  const PLOT_HEIGHT = 2000;
  const CIRCLE_RADIUS = 2.5;
  
  function handleContentLoaded() {
    const { scan, startWith } = rxjs.operators;
  
    const canvas = document.querySelector('#canvas');
    const ctx = canvas.getContext("2d");

    const scaleX = getScale(0, PLOT_WIDTH);
    const scaleY = getScale(0, PLOT_HEIGHT);
    
    const { width, height } = canvas;
  
    const initialViewport = { x: 0, y: 0, width, height }

    const viewportChanges$ = dragsOn(canvas)
      .pipe(
        scan((viewport, { dx, dy }) => {
          const { x, y } = viewport;
          return {
            ...viewport,
            x: scaleX(x + dx),
            y: scaleY(y + dy)
          }
        }, initialViewport)
      );
    
    viewportChanges$
      .pipe(startWith(initialViewport))
      .subscribe((changedViewPort) => {
        draw(ctx, points, changedViewPort);
      })
  }

  function draw(ctx, points, viewport) {
    const filteredPoints = filterPoints(points, viewport);
    
    ctx.clearRect(0, 0, viewport.width, viewport.height);
    filteredPoints.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x - viewport.x, point.y - viewport.y, CIRCLE_RADIUS, 0, 2 * Math.PI);
      ctx.stroke();
    })
  }

  function filterPoints(points, viewport) {
    return points.filter(point => {
      return (
        point.x > viewport.x + CIRCLE_RADIUS &&
        point.x < viewport.x + viewport.width - CIRCLE_RADIUS &&
        point.y > viewport.y + CIRCLE_RADIUS &&
        point.y < viewport.y + viewport.height - CIRCLE_RADIUS
      );
    })

  }

  function dragsOn(el) {
    const { fromEvent, merge } = rxjs;
    const { takeUntil, map, mergeMap, pairwise } = rxjs.operators;

    const move$ = fromEvent(el, 'mousemove');
    const down$ = fromEvent(el, 'mousedown')
    const up$ = fromEvent(el, 'mouseup')
    const out$ = fromEvent(el, 'mouseout');

    return down$.pipe(
      mergeMap(e => move$.pipe(
        pairwise(),
        map(([prev, next]) => ({
          dx: prev.clientX - next.clientX,
          dy: prev.clientY - next.clientY
        })),
        takeUntil(merge(up$, out$))
      ))
    );
  }

  function getScale(min, max) {
    return (position) => Math.max(min, Math.min(position, max));
  }

  document.addEventListener('DOMContentLoaded', handleContentLoaded);
})();
