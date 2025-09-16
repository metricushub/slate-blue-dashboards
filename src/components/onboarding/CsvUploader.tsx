import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Check, X, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CsvColumn {
  name: string;
  values: string[];
  mappedTo?: string;
}

interface CsvUploaderProps {
  onDataImport: (mappedData: Record<string, any>) => void;
  targetFields: { key: string; label: string; section: string }[];
  clientId?: string;
}

export function CsvUploader({ onDataImport, targetFields, clientId }: CsvUploaderProps) {
  const [csvData, setCsvData] = useState<CsvColumn[]>([]);
  const [isUploaded, setIsUploaded] = useState(false);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo CSV.',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCsv(text);
    };
    reader.readAsText(file);
  };

  const parseCsv = (csvText: string) => {
    try {
      const lines = csvText.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV deve ter pelo menos um cabeçalho e uma linha de dados');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      const columns: CsvColumn[] = headers.map((header, index) => ({
        name: header,
        values: dataRows.map(row => row[index] || '').filter(val => val.trim() !== '')
      }));

      setCsvData(columns);
      setIsUploaded(true);
      
      // Auto-map common fields
      autoMapFields(columns);

      toast({
        title: 'Sucesso',
        description: `CSV carregado com ${columns.length} colunas e ${dataRows.length} linhas.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar o arquivo CSV: ' + (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const autoMapFields = (columns: CsvColumn[]) => {
    const mapping: Record<string, string> = {};
    
    // Common field mappings (case insensitive)
    const commonMappings: Record<string, string[]> = {
      'dados-gerais.razaoSocial': ['razao social', 'empresa', 'company', 'nome empresa'],
      'dados-gerais.cnpj': ['cnpj', 'documento'],
      'dados-gerais.contatoComercial': ['contato comercial', 'comercial', 'vendedor'],
      'dados-gerais.contatoTecnico': ['contato tecnico', 'tecnico', 'suporte'],
      'financeiro.dadosBancarios': ['dados bancarios', 'banco', 'conta'],
      'financeiro.cicloCobranca': ['ciclo cobranca', 'ciclo', 'cobranca'],
      'financeiro.limiteInvestimento': ['limite investimento', 'orcamento', 'budget'],
      'briefing.responsavel': ['responsavel', 'gerente', 'contato'],
      'briefing.observacoes': ['observacoes', 'notas', 'comentarios', 'notes']
    };

    columns.forEach(column => {
      const columnNameLower = column.name.toLowerCase();
      
      for (const [targetField, variations] of Object.entries(commonMappings)) {
        if (variations.some(variation => columnNameLower.includes(variation))) {
          mapping[column.name] = targetField;
          break;
        }
      }
    });

    setFieldMapping(mapping);
  };

  const handleFieldMapping = (columnName: string, targetField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [columnName]: targetField || ''
    }));
  };

  const handleImport = () => {
    const mappedData: Record<string, any> = {};
    
    // Initialize sections
    const sections = ['dados-gerais', 'financeiro', 'briefing', 'implementacao', 'configuracao'];
    sections.forEach(section => {
      mappedData[section] = {};
    });

    // Map CSV data to form structure
    Object.entries(fieldMapping).forEach(([columnName, targetField]) => {
      if (!targetField) return;
      
      const column = csvData.find(col => col.name === columnName);
      if (!column || column.values.length === 0) return;

      // Use first non-empty value
      const value = column.values[0];
      
      if (targetField.includes('.')) {
        const [section, field] = targetField.split('.');
        if (!mappedData[section]) mappedData[section] = {};
        mappedData[section][field] = value;
      } else {
        mappedData[targetField] = value;
      }
    });

    onDataImport(mappedData);
    
    toast({
      title: 'Dados Importados',
      description: `${Object.keys(fieldMapping).filter(k => fieldMapping[k]).length} campos foram preenchidos automaticamente.`,
    });
  };

  const downloadTemplate = () => {
    const headers = targetFields.map(field => field.label);
    const csvContent = headers.join(',') + '\n' + 
                      'Exemplo 1,' + headers.slice(1).map(() => '').join(',') + '\n' +
                      'Exemplo 2,' + headers.slice(1).map(() => '').join(',');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-onboarding-${clientId || 'cliente'}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Dados do Briefing (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Selecionar CSV
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar Template
          </Button>
        </div>

        <Input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        {isUploaded && csvData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {csvData.length} colunas encontradas
              </span>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mapeamento de Campos</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {csvData.map((column) => (
                      <div key={column.name} className="flex items-center gap-4 p-2 border rounded">
                        <div className="flex-1">
                          <Label className="text-sm font-medium">{column.name}</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {column.values.slice(0, 3).map((value, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {value.length > 20 ? value.substring(0, 20) + '...' : value}
                              </Badge>
                            ))}
                            {column.values.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{column.values.length - 3} mais
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Select
                          value={fieldMapping[column.name] || ''}
                          onValueChange={(value) => handleFieldMapping(column.name, value)}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Mapear para..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Não mapear</SelectItem>
                            {targetFields.map((field) => (
                              <SelectItem key={field.key} value={field.key}>
                                {field.section} - {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-muted-foreground">
                    {Object.values(fieldMapping).filter(Boolean).length} campos mapeados
                  </span>
                  
                  <Button 
                    onClick={handleImport}
                    disabled={Object.values(fieldMapping).filter(Boolean).length === 0}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Importar Dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}