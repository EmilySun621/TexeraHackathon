/**
 * Workflow validation utilities
 */

import type { WorkflowContent, OperatorPredicate, OperatorLink } from '../types/workflow';
import type { ValidationResult, ValidationError } from '../types/wizard';
import { getOperatorByType, getAllOperatorTypes } from '../data/operatorCatalog';

/**
 * Validate a generated workflow
 */
export function validateWorkflow(workflow: WorkflowContent): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // 1. Validate basic structure
  if (!workflow.operators || !Array.isArray(workflow.operators)) {
    errors.push({
      field: 'operators',
      message: 'Workflow must contain an operators array',
    });
    return { isValid: false, errors, warnings };
  }

  if (!workflow.links || !Array.isArray(workflow.links)) {
    errors.push({
      field: 'links',
      message: 'Workflow must contain a links array',
    });
  }

  if (!workflow.operatorPositions || typeof workflow.operatorPositions !== 'object') {
    errors.push({
      field: 'operatorPositions',
      message: 'Workflow must contain operatorPositions object',
    });
  }

  if (!workflow.settings) {
    warnings.push('Missing workflow settings - using defaults');
  }

  // 2. Validate operators
  const operatorIds = new Set<string>();
  const validOperatorTypes = getAllOperatorTypes();

  for (let i = 0; i < workflow.operators.length; i++) {
    const operator = workflow.operators[i];
    const opErrors = validateOperator(operator, i, validOperatorTypes);
    errors.push(...opErrors);

    if (operator.operatorID) {
      if (operatorIds.has(operator.operatorID)) {
        errors.push({
          field: `operators[${i}].operatorID`,
          message: `Duplicate operator ID: ${operator.operatorID}`,
        });
      }
      operatorIds.add(operator.operatorID);
    }
  }

  // 3. Validate operator positions
  if (workflow.operatorPositions) {
    for (const opId of operatorIds) {
      if (!workflow.operatorPositions[opId]) {
        errors.push({
          field: 'operatorPositions',
          message: `Missing position for operator: ${opId}`,
        });
      } else {
        const pos = workflow.operatorPositions[opId];
        if (typeof pos.x !== 'number' || typeof pos.y !== 'number') {
          errors.push({
            field: `operatorPositions[${opId}]`,
            message: 'Position must have numeric x and y coordinates',
          });
        }
      }
    }
  }

  // 4. Validate links
  const linkIds = new Set<string>();
  for (let i = 0; i < workflow.links.length; i++) {
    const link = workflow.links[i];
    const linkErrors = validateLink(link, i, operatorIds, workflow.operators);
    errors.push(...linkErrors);

    if (link.linkID) {
      if (linkIds.has(link.linkID)) {
        errors.push({
          field: `links[${i}].linkID`,
          message: `Duplicate link ID: ${link.linkID}`,
        });
      }
      linkIds.add(link.linkID);
    }
  }

  // 5. Validate workflow connectivity
  const connectivityWarnings = validateConnectivity(workflow.operators, workflow.links);
  warnings.push(...connectivityWarnings);

  // 6. Check for source operators
  const hasSourceOperator = workflow.operators.some(op => {
    const metadata = getOperatorByType(op.operatorType);
    return metadata && metadata.inputPorts === 0;
  });

  if (!hasSourceOperator) {
    warnings.push('No source operator found - workflow may not be executable');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate a single operator
 */
function validateOperator(
  operator: OperatorPredicate,
  index: number,
  validOperatorTypes: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!operator.operatorID) {
    errors.push({
      field: `operators[${index}].operatorID`,
      message: 'Operator must have an operatorID',
    });
  }

  if (!operator.operatorType) {
    errors.push({
      field: `operators[${index}].operatorType`,
      message: 'Operator must have an operatorType',
    });
  } else if (!validOperatorTypes.includes(operator.operatorType)) {
    errors.push({
      field: `operators[${index}].operatorType`,
      message: `Unknown operator type: ${operator.operatorType}. Must be one of: ${validOperatorTypes.join(', ')}`,
    });
  }

  if (!operator.operatorProperties || typeof operator.operatorProperties !== 'object') {
    errors.push({
      field: `operators[${index}].operatorProperties`,
      message: 'Operator must have operatorProperties object',
    });
  }

  if (!Array.isArray(operator.inputPorts)) {
    errors.push({
      field: `operators[${index}].inputPorts`,
      message: 'Operator must have inputPorts array',
    });
  }

  if (!Array.isArray(operator.outputPorts)) {
    errors.push({
      field: `operators[${index}].outputPorts`,
      message: 'Operator must have outputPorts array',
    });
  }

  // Validate required properties
  if (operator.operatorType) {
    const metadata = getOperatorByType(operator.operatorType);
    if (metadata) {
      for (const prop of metadata.properties) {
        if (prop.required && !(prop.name in operator.operatorProperties)) {
          errors.push({
            field: `operators[${index}].operatorProperties.${prop.name}`,
            message: `Missing required property: ${prop.name}`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validate a single link
 */
function validateLink(
  link: OperatorLink,
  index: number,
  operatorIds: Set<string>,
  operators: OperatorPredicate[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!link.linkID) {
    errors.push({
      field: `links[${index}].linkID`,
      message: 'Link must have a linkID',
    });
  }

  if (!link.source || !link.source.operatorID || !link.source.portID) {
    errors.push({
      field: `links[${index}].source`,
      message: 'Link must have valid source with operatorID and portID',
    });
  } else {
    if (!operatorIds.has(link.source.operatorID)) {
      errors.push({
        field: `links[${index}].source.operatorID`,
        message: `Source operator not found: ${link.source.operatorID}`,
      });
    } else {
      // Validate source port exists
      const sourceOp = operators.find(op => op.operatorID === link.source.operatorID);
      if (sourceOp && !sourceOp.outputPorts.some(p => p.portID === link.source.portID)) {
        errors.push({
          field: `links[${index}].source.portID`,
          message: `Source port ${link.source.portID} not found in operator ${link.source.operatorID}`,
        });
      }
    }
  }

  if (!link.target || !link.target.operatorID || !link.target.portID) {
    errors.push({
      field: `links[${index}].target`,
      message: 'Link must have valid target with operatorID and portID',
    });
  } else {
    if (!operatorIds.has(link.target.operatorID)) {
      errors.push({
        field: `links[${index}].target.operatorID`,
        message: `Target operator not found: ${link.target.operatorID}`,
      });
    } else {
      // Validate target port exists
      const targetOp = operators.find(op => op.operatorID === link.target.operatorID);
      if (targetOp && !targetOp.inputPorts.some(p => p.portID === link.target.portID)) {
        errors.push({
          field: `links[${index}].target.portID`,
          message: `Target port ${link.target.portID} not found in operator ${link.target.operatorID}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Validate workflow connectivity
 */
function validateConnectivity(
  operators: OperatorPredicate[],
  links: OperatorLink[]
): string[] {
  const warnings: string[] = [];

  // Build adjacency map
  const incomingLinks = new Map<string, number>();
  const outgoingLinks = new Map<string, number>();

  for (const link of links) {
    const sourceId = link.source.operatorID;
    const targetId = link.target.operatorID;

    outgoingLinks.set(sourceId, (outgoingLinks.get(sourceId) || 0) + 1);
    incomingLinks.set(targetId, (incomingLinks.get(targetId) || 0) + 1);
  }

  // Check for disconnected operators
  for (const op of operators) {
    const metadata = getOperatorByType(op.operatorType);
    if (!metadata) continue;

    const hasIncoming = incomingLinks.has(op.operatorID);
    const hasOutgoing = outgoingLinks.has(op.operatorID);

    // Source operators (0 input ports) should not have incoming links
    if (metadata.inputPorts === 0 && hasIncoming) {
      warnings.push(`Source operator ${op.customDisplayName || op.operatorType} has incoming links`);
    }

    // Non-source operators should have incoming links
    if (metadata.inputPorts > 0 && !hasIncoming) {
      warnings.push(`Operator ${op.customDisplayName || op.operatorType} has no incoming links`);
    }

    // Operators with output ports should have outgoing links (unless it's a sink/visualization)
    if (metadata.outputPorts > 0 && !hasOutgoing && metadata.category !== 'Visualization') {
      warnings.push(`Operator ${op.customDisplayName || op.operatorType} has no outgoing links`);
    }
  }

  return warnings;
}
