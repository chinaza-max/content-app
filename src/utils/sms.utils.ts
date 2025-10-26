import mustache from 'mustache';
import jsonpath from 'jsonpath';

export const renderTemplate = (template: string, context: Record<string, any>) => {
  return mustache.render(template, context);
};

export const evaluateSuccess = (data: any, matchRule?: string): boolean => {
  if (!matchRule) return true;
  if (matchRule.includes('==')) {
    const [path, value] = matchRule.split('==').map(v => v.trim());
    const actual = path.split('.').reduce((acc, k) => acc?.[k], data);
    return actual?.toString() === value;
  }
  if (matchRule.startsWith('$')) {
    const result = jsonpath.query(data, matchRule);
    return result.length > 0;
  }
  const actual = matchRule.split('.').reduce((acc, k) => acc?.[k], data);
  return actual !== undefined && actual !== null;
};
