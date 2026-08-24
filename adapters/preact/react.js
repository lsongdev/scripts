import htm from 'htm';
import { h } from 'preact';

export * from 'preact';
export * from 'preact/hooks';
export const html = htm.bind(h);
