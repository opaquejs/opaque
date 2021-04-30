const normalizers: Array<(value: string) => string[]> = [
  (value) => value.split("-"),
  (value) => value.split("_"),
  (value) => {
    const result = [""];
    for (const char of value) {
      if (char.toUpperCase() == char) {
        result.push(char);
      } else [(result[result.length - 1] += char)];
    }
    return result;
  },
  (value) => [value.toLowerCase()],
];

export const applyNormalizer = (values: string[], normalizer: (value: string) => string[]) => {
  return values.reduce((normalized, value) => [...normalized, ...normalizer(value)], [] as string[]);
};

export const normalize = (value: string[] | string) => {
  return normalizers
    .reduce((normalized, normalizer) => applyNormalizer(normalized, normalizer), Array.isArray(value) ? value : [value])
    .filter((e) => e.length > 0);
};

export const camelize = (value: string | string[]) => {
  const PascalCase = pascalize(value);
  return PascalCase[0].toLowerCase() + PascalCase.slice(1);
};
export const pascalize = (value: string | string[]) => {
  const normal = normalize(value);
  return normal.reduce((camelized, current) => `${camelized}${current[0].toUpperCase()}${current.slice(1)}`, "");
};

export const dasherize = (value: string | string[]) => {
  const normal = normalize(value);
  return normal.reduce((camelized, current) => `${camelized}-${current}`, "").slice(1);
};
