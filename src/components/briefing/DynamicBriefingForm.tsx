import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { BriefingTemplate, BriefingField, BriefingResponse } from '@/types/briefing';
import { briefingTemplateOperations, briefingResponseOperations } from '@/shared/db/briefingStore';

interface DynamicBriefingFormProps {
  clientId: string;
  templateId?: string;
}

export function DynamicBriefingForm({ clientId, templateId }: DynamicBriefingFormProps) {
  const [template, setTemplate] = useState<BriefingTemplate | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      
      let currentTemplate: BriefingTemplate | undefined;
      
      if (templateId) {
        currentTemplate = await briefingTemplateOperations.getById(templateId);
      } else {
        currentTemplate = await briefingTemplateOperations.getDefault();
      }

      if (!currentTemplate) {
        toast.error('Template de briefing não encontrado');
        return;
      }

      setTemplate(currentTemplate);

      // Carregar respostas existentes
      const existingResponse = await briefingResponseOperations.getByClientAndTemplate(
        clientId,
        currentTemplate.id
      );

      if (existingResponse) {
        setResponses(existingResponse.responses || {});
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar template de briefing');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Limpar erro do campo se houver
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!template) return false;

    const newErrors: Record<string, string> = {};

    template.fields.forEach(field => {
      if (field.required && (!responses[field.id] || responses[field.id] === '')) {
        newErrors[field.id] = 'Este campo é obrigatório';
      }

      // Validações específicas
      if (responses[field.id] && field.validation) {
        const value = responses[field.id];
        const validation = field.validation;

        if (field.type === 'number') {
          const numValue = Number(value);
          if (validation.min !== undefined && numValue < validation.min) {
            newErrors[field.id] = `Valor mínimo: ${validation.min}`;
          }
          if (validation.max !== undefined && numValue > validation.max) {
            newErrors[field.id] = `Valor máximo: ${validation.max}`;
          }
        }

        if (field.type === 'text' || field.type === 'textarea') {
          if (validation.min !== undefined && value.length < validation.min) {
            newErrors[field.id] = `Mínimo ${validation.min} caracteres`;
          }
          if (validation.max !== undefined && value.length > validation.max) {
            newErrors[field.id] = `Máximo ${validation.max} caracteres`;
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
            newErrors[field.id] = 'Formato inválido';
          }
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!template || !validateForm()) return;

    try {
      setSaving(true);
      
      await briefingResponseOperations.saveResponse(
        clientId,
        template.id,
        responses
      );

      toast.success('Briefing salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar briefing:', error);
      toast.error('Erro ao salvar briefing');
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: BriefingField) => {
    const value = responses[field.id] || '';
    const error = errors[field.id];

    const baseProps = {
      id: field.id,
      placeholder: field.placeholder,
      className: error ? 'border-destructive' : ''
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <Input
            {...baseProps}
            type={field.type}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...baseProps}
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            {...baseProps}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'date':
        return (
          <Input
            {...baseProps}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
          />
        );

      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multi-select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedValues.map((val: string) => {
                const option = field.options?.find(opt => opt.value === val);
                return option ? (
                  <Badge key={val} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {option.label}
                  </Badge>
                ) : null;
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.value}`}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, option.value]
                        : selectedValues.filter((v: string) => v !== option.value);
                      handleFieldChange(field.id, newValues);
                    }}
                  />
                  <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup
            value={value}
            onValueChange={(val) => handleFieldChange(field.id, val)}
            className="space-y-2"
          >
            {field.options?.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                <Label htmlFor={`${field.id}-${option.value}`} className="text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={!!value}
              onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
            />
            <Label htmlFor={field.id} className="text-sm font-normal">
              {field.placeholder || 'Sim'}
            </Label>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Carregando briefing...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!template) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Template de briefing não encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedFields = [...template.fields].sort((a, b) => a.order - b.order);

  return (
    <Card className="h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {template.name}
        </CardTitle>
        {template.description && (
          <p className="text-sm text-muted-foreground">{template.description}</p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-6">
            {sortedFields.map((field, index) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="text-sm font-medium flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}
                
                {renderField(field)}
                
                {errors[field.id] && (
                  <div className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {errors[field.id]}
                  </div>
                )}
              </div>
            ))}

            <div className="pt-4 border-t">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Briefing'}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}