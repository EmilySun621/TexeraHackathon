/**
 * Texera Workflow JSON Schema Types
 * Based on the actual Texera codebase
 */

export interface Point {
  x: number;
  y: number;
}

export interface LogicalPort {
  operatorID: string;
  portID: string;
}

export interface PortDescription {
  portID: string;
  displayName?: string;
  allowMultiInputs?: boolean;
  isDynamicPort?: boolean;
  dependencies?: { id: number; internal: boolean }[];
}

export interface OperatorPredicate {
  operatorID: string;
  operatorType: string;
  operatorVersion: string;
  operatorProperties: Record<string, any>;
  inputPorts: PortDescription[];
  outputPorts: PortDescription[];
  dynamicInputPorts?: boolean;
  dynamicOutputPorts?: boolean;
  showAdvanced: boolean;
  isDisabled?: boolean;
  viewResult?: boolean;
  markedForReuse?: boolean;
  customDisplayName?: string;
}

export interface OperatorLink {
  linkID: string;
  source: LogicalPort;
  target: LogicalPort;
}

export interface Comment {
  content: string;
  creationTime: string;
  creatorName: string;
  creatorID: number;
}

export interface CommentBox {
  commentBoxID: string;
  comments: Comment[];
  commentBoxPosition: Point;
}

export interface WorkflowSettings {
  dataTransferBatchSize: number;
  executionMode?: 'PIPELINED' | 'MATERIALIZED';
}

export interface WorkflowContent {
  operators: OperatorPredicate[];
  operatorPositions: { [key: string]: Point };
  links: OperatorLink[];
  commentBoxes: CommentBox[];
  settings: WorkflowSettings;
}

export interface WorkflowMetadata {
  name: string;
  description?: string;
  wid?: number;
  creationTime?: number;
  lastModifiedTime?: number;
  isPublished?: number;
  readonly?: boolean;
}

export type Workflow = { content: WorkflowContent } & WorkflowMetadata;
