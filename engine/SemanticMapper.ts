import { ISemanticMapper, ActionType, SemanticMapping } from '@/types';
import { SEMANTIC_MAPPINGS } from '@/config/semanticMappings';

export class SemanticMapper implements ISemanticMapper {
  private mappings: SemanticMapping[];

  constructor(initialMappings?: SemanticMapping[]) {
    this.mappings = [...(initialMappings || SEMANTIC_MAPPINGS)];
  }

  matchSemantic(field: string): ActionType | null {
    const trimmed = field.trim();
    if (!trimmed) return null;

    for (const mapping of this.mappings) {
      for (const keyword of mapping.keywords) {
        if (mapping.matchMode === 'exact') {
          if (trimmed === keyword) return mapping.actionType;
        } else {
          if (trimmed.includes(keyword)) return mapping.actionType;
        }
      }
    }
    return null;
  }

  getActionForSemantic(keyword: string): ActionType | null {
    for (const mapping of this.mappings) {
      if (mapping.keywords.includes(keyword)) {
        return mapping.actionType;
      }
    }
    return null;
  }

  addMapping(mapping: SemanticMapping): void {
    this.mappings.push(mapping);
  }

  getMappings(): SemanticMapping[] {
    return [...this.mappings];
  }
}
