
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status) {
    case "pendente":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
    case "aprovado":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Aprovado</Badge>;
    case "rejeitado":
      return <Badge variant="secondary" className="bg-red-100 text-red-800">Rejeitado</Badge>;
    case "suspenso":
      return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Suspenso</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
