export function modelURL(task, size, precision) {
  const url = new URL(`./loop${task}-s-${size}-${precision}.onnx`, import.meta.url);
  if (task === 'det') url.searchParams.set('v', 'd4');
  return url;
}
