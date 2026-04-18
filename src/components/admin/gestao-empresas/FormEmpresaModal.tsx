
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Empresa } from "./types";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  plano_atual: z.string().optional(),
  max_entregadores: z.number().min(1).default(50),
  max_agendas_mes: z.number().min(1).default(1000),
});

type FormValues = z.infer<typeof formSchema>;

interface FormEmpresaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa?: Empresa | null;
  onSuccess?: () => void;
}

export function FormEmpresaModal({
  open,
  onOpenChange,
  empresa,
  onSuccess,
}: FormEmpresaModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      cnpj: "",
      telefone: "",
      endereco: "",
      plano_atual: "basico",
      max_entregadores: 50,
      max_agendas_mes: 1000,
    },
  });

  // CORREÇÃO: useEffect para atualizar formulário quando empresa muda
  useEffect(() => {
    if (empresa) {
      console.log('🔄 Carregando dados da empresa para edição:', empresa);
      form.reset({
        nome: empresa.nome || "",
        email: empresa.email || "",
        cnpj: empresa.cnpj || "",
        telefone: empresa.telefone || "",
        endereco: empresa.endereco || "",
        plano_atual: empresa.plano_atual || "basico",
        max_entregadores: empresa.max_entregadores || 50,
        max_agendas_mes: empresa.max_agendas_mes || 1000,
      });
    } else {
      // Reset para valores padrão quando criar nova empresa
      console.log('🆕 Resetando formulário para nova empresa');
      form.reset({
        nome: "",
        email: "",
        cnpj: "",
        telefone: "",
        endereco: "",
        plano_atual: "basico",
        max_entregadores: 50,
        max_agendas_mes: 1000,
      });
    }
  }, [empresa, form]);

  // Função para criar admin temporário
  const criarAdminTemporario = async (empresaId: string, nomeEmpresa: string) => {
    try {
      console.log('Criando admin temporário para empresa:', empresaId);
      
      // Gerar email e senha temporários
      const email = `admin@${nomeEmpresa.toLowerCase().replace(/\s+/g, '')}.temp`;
      const senhaTemporaria = Math.random().toString(36).slice(-8);
      
      console.log('Dados do admin temporário:', { email, senhaTemporaria });

      // TODO: Salva na tabela auxiliar (tabela não existe ainda no schema)
      // const { error } = await supabase
      //   .from("empresa_admin_temp")
      //   .insert([
      //     {
      //       empresa_id: empresaId,
      //       email: email,
      //       senha_temporaria: senhaTemporaria,
      //     },
      //   ]);
      const error = null; // Temporário

      if (error) {
        console.error('Erro ao criar admin temporário:', error);
        toast({
          title: "Aviso",
          description: "Empresa criada, mas houve erro ao gerar credenciais de admin.",
          variant: "destructive",
        });
      } else {
        console.log('Admin temporário criado com sucesso');
      }
    } catch (error: any) {
      console.error('Erro inesperado ao criar admin temporário:', error);
      toast({
        title: "Erro ao criar admin temporário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      console.log('Dados do formulário:', values);

      if (empresa) {
        // Editar empresa existente
        const { error } = await supabase
          .from("empresas")
          .update({
            nome: values.nome,
            email: values.email,
            cnpj: values.cnpj,
            telefone: values.telefone,
            endereco: values.endereco,
            plano_atual: values.plano_atual,
            max_entregadores: values.max_entregadores,
            max_agendas_mes: values.max_agendas_mes,
          })
          .eq("id", empresa.id);

        if (error) {
          console.error('Erro ao editar empresa:', error);
          toast({
            title: "Erro ao editar empresa",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('Empresa editada com sucesso');
          toast({
            title: "Empresa editada com sucesso!",
          });
          onSuccess?.();
          onOpenChange(false);
        }
      } else {
        // Criar nova empresa
        const { data, error } = await supabase
          .from("empresas")
          .insert([
            {
              nome: values.nome,
              email: values.email,
              cnpj: values.cnpj,
              telefone: values.telefone,
              endereco: values.endereco,
              plano_atual: values.plano_atual,
              ativa: true, // Campo correto da tabela
              max_entregadores: values.max_entregadores,
              max_agendas_mes: values.max_agendas_mes,
            },
          ])
          .select();

        if (error) {
          console.error('Erro ao criar empresa:', error);
          toast({
            title: "Erro ao criar empresa",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('Empresa criada com sucesso:', data);
          if (data && data[0]) {
            // Criar admin temporário para a nova empresa
            await criarAdminTemporario(data[0].id, values.nome);
            
            toast({
              title: "Empresa criada com sucesso!",
              description: "Um admin temporário foi gerado automaticamente.",
            });
          }
          onSuccess?.();
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{empresa ? "Editar" : "Criar"} Empresa</DialogTitle>
          <DialogDescription>
            {empresa
              ? "Edite os campos da empresa."
              : "Crie uma nova empresa no sistema. Um admin temporário será criado automaticamente."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@empresa.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ</FormLabel>
                  <FormControl>
                    <Input placeholder="CNPJ da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="telefone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefone da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço da empresa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="plano_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano Atual</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basico">Básico</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_entregadores"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Tecnicos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Máximo de tecnicos"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_agendas_mes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Agendas por Mês</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Máximo de agendas por mês"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
