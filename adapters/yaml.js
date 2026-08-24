import {
  parse,
  parseAllDocuments,
  parseDocument,
  stringify,
} from 'yaml';

/** Parse one YAML document using the pinned `yaml` package. */
export const parseYAML = (source, options) => parse(source, options);

/** Parse one YAML document while preserving comments and node metadata. */
export const parseYAMLDocument = (source, options) => parseDocument(source, options);

/** Parse a YAML stream into Document objects. */
export const parseYAMLDocuments = (source, options) => parseAllDocuments(source, options);

/** Serialize a JavaScript value as YAML. */
export const stringifyYAML = (value, replacer, options) =>
  stringify(value, replacer, options);
