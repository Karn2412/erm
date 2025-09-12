
  export function fillTemplate(html: string, data: Record<string, string | number | null | undefined>) {
  return html.replace(/{{(.*?)}}/g, (_, key) => {
    const trimmedKey = key.trim();
    const value = data[trimmedKey];
    return value !== undefined && value !== null ? String(value) : "";
  });
}
