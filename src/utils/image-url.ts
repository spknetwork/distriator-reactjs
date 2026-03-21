const HIVE_IMAGE_PROXY_REGEX = /^https:\/\/images\.hive\.blog\/\d+x\d+\//;

export function stripHiveImageProxy(url: string): string {
  let stripped = url;
  while (HIVE_IMAGE_PROXY_REGEX.test(stripped)) {
    stripped = stripped.replace(HIVE_IMAGE_PROXY_REGEX, "");
  }
  return stripped;
}
