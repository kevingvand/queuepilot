import { definition as addItemLinkDefinition, addItemLink } from './add.js';
import { definition as removeItemLinkDefinition, removeItemLink } from './remove.js';

export const LINK_TOOL_DEFINITIONS = [addItemLinkDefinition, removeItemLinkDefinition];

export { addItemLink, removeItemLink };
