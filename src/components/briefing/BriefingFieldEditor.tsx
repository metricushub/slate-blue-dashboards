import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save, X, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { BriefingTemplate, BriefingField, FieldType, BriefingFieldOption } from '@/types/briefing';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BriefingFieldEditorProps {
  template: BriefingTemplate | null;
  onSave: (templateData: Partial<BriefingTemplate>) => void;
  onCancel: () => void;
}

interface SortableFieldProps {
  field: BriefingField;
  index: number;
  onEdit: (field: BriefingField) => void;
  onDelete: (fieldId: string) => void;
}

function SortableField({ field, index, onEdit, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border rounded-lg p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{field.label}</span>
              {field.required && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
            </div>
            <div className="text-sm text-muted-foreground">
              Tipo: {field.type} | Ordem: {field.order}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(field)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onDelete(field.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texto simples' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'date', label: 'Data' },
  { value: 'email', label: 'E-mail' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Seleção única' },
  { value: 'multi-select', label: 'Seleção múltipla' },
  { value: 'radio', label: 'Opções (radio)' },
  { value: 'checkbox', label: 'Checkbox' }
];

export function BriefingFieldEditor({ template, onSave, onCancel }: BriefingFieldEditorProps) {
  const [templateData, setTemplateData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    isDefault: template?.isDefault || false
  });

  const [fields, setFields] = useState<BriefingField[]>(template?.fields || []);
  const [editingField, setEditingField] = useState<BriefingField | null>(null);
  const [isCreatingField, setIsCreatingField] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleCreateField = () => {
    const newField: BriefingField = {
      id: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false,
      order: fields.length + 1
    };
    setEditingField(newField);
    setIsCreatingField(true);
  };

  const handleEditField = (field: BriefingField) => {
    setEditingField({ ...field });
    setIsCreatingField(false);
  };

  const handleSaveField = () => {
    if (!editingField || !editingField.label.trim()) {
      toast.error('Nome do campo é obrigatório');
      return;
    }

    if (isCreatingField) {
      setFields(prev => [...prev, editingField]);
    } else {
      setFields(prev => prev.map(f => f.id === editingField.id ? editingField : f));
    }

    setEditingField(null);
    setIsCreatingField(false);
  };

  const handleDeleteField = (fieldId: string) => {
    setFields(prev => prev.filter(f => f.id !== fieldId));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        
        const reorderedFields = arrayMove(items, oldIndex, newIndex);
        
        // Atualizar ordem
        return reorderedFields.map((field, index) => ({
          ...field,
          order: index + 1
        }));
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateData.name.trim()) {
      toast.error('Nome do template é obrigatório');
      return;
    }

    if (fields.length === 0) {
      toast.error('Adicione pelo menos um campo ao template');
      return;
    }

    onSave({
      ...templateData,
      fields: fields.map((field, index) => ({ ...field, order: index + 1 }))
    });
  };

  const updateFieldOption = (index: number, option: Partial<BriefingFieldOption>) => {
    if (!editingField) return;

    const updatedOptions = [...(editingField.options || [])];
    updatedOptions[index] = { ...updatedOptions[index], ...option };
    
    setEditingField({
      ...editingField,
      options: updatedOptions
    });
  };

  const addFieldOption = () => {
    if (!editingField) return;

    const newOption: BriefingFieldOption = {
      value: '',
      label: ''
    };

    setEditingField({
      ...editingField,
      options: [...(editingField.options || []), newOption]
    });
  };

  const removeFieldOption = (index: number) => {
    if (!editingField) return;

    const updatedOptions = editingField.options?.filter((_, i) => i !== index) || [];
    setEditingField({
      ...editingField,
      options: updatedOptions
    });
  };

  const needsOptions = editingField?.type === 'select' || editingField?.type === 'multi-select' || editingField?.type === 'radio';

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="fields" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="flex-1 space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Nome do Template</Label>
              <Input
                id="template-name"
                value={templateData.name}
                onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Briefing Básico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-description">Descrição</Label>
              <Textarea
                id="template-description"
                value={templateData.description}
                onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva quando usar este template..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="template-default"
                checked={templateData.isDefault}
                onCheckedChange={(checked) => setTemplateData(prev => ({ ...prev, isDefault: !!checked }))}
              />
              <Label htmlFor="template-default">Definir como template padrão</Label>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fields" className="flex-1 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Campos do Formulário</h3>
            <Button onClick={handleCreateField}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Campo
            </Button>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de Campos */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-muted-foreground">
                Campos ({fields.length})
              </h4>
              
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {fields.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum campo adicionado ainda
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext items={fields} strategy={verticalListSortingStrategy}>
                        {fields.map((field, index) => (
                          <SortableField
                            key={field.id}
                            field={field}
                            index={index}
                            onEdit={handleEditField}
                            onDelete={handleDeleteField}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Editor de Campo */}
            <div className="space-y-4">
              {editingField ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {isCreatingField ? 'Novo Campo' : 'Editar Campo'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="field-label">Rótulo</Label>
                      <Input
                        id="field-label"
                        value={editingField.label}
                        onChange={(e) => setEditingField({ ...editingField, label: e.target.value })}
                        placeholder="Ex: Qual é o seu objetivo?"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-type">Tipo de Campo</Label>
                      <Select
                        value={editingField.type}
                        onValueChange={(value: FieldType) => setEditingField({ ...editingField, type: value, options: value === 'checkbox' ? undefined : editingField.options })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-placeholder">Placeholder/Texto de Ajuda</Label>
                      <Input
                        id="field-placeholder"
                        value={editingField.placeholder || ''}
                        onChange={(e) => setEditingField({ ...editingField, placeholder: e.target.value })}
                        placeholder="Texto que aparece no campo vazio..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="field-description">Descrição</Label>
                      <Textarea
                        id="field-description"
                        value={editingField.description || ''}
                        onChange={(e) => setEditingField({ ...editingField, description: e.target.value })}
                        placeholder="Instrução adicional para o campo..."
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-required"
                        checked={editingField.required}
                        onCheckedChange={(checked) => setEditingField({ ...editingField, required: !!checked })}
                      />
                      <Label htmlFor="field-required">Campo obrigatório</Label>
                    </div>

                    {/* Opções para campos de seleção */}
                    {needsOptions && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Opções</Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addFieldOption}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {editingField.options?.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                placeholder="Valor"
                                value={option.value}
                                onChange={(e) => updateFieldOption(index, { value: e.target.value })}
                                className="flex-1"
                              />
                              <Input
                                placeholder="Rótulo"
                                value={option.label}
                                onChange={(e) => updateFieldOption(index, { label: e.target.value })}
                                className="flex-1"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFieldOption(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-4">
                      <Button onClick={handleSaveField} size="sm">
                        <Save className="h-3 w-3 mr-1" />
                        Salvar Campo
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingField(null);
                          setIsCreatingField(false);
                        }}
                        size="sm"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Selecione um campo para editar ou crie um novo
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={handleSaveTemplate}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Template
        </Button>
      </div>
    </div>
  );
}