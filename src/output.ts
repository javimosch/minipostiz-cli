export function out(data: any): void {
  process.stdout.write(JSON.stringify(data) + "\n");
}

export function err(message: string, code = 1): void {
  process.stderr.write(JSON.stringify({ error: message, code }) + "\n");
  process.exit(code);
}

export function humanOut(data: any): void {
  if (typeof data === "object") {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}
