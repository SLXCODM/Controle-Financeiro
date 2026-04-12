import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';
import { forwardRef } from 'react';

interface DynamicIconProps extends LucideProps {
  name: string;
}

// Map of icon names to components
const iconMap: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  Briefcase: Icons.Briefcase,
  Laptop: Icons.Laptop,
  TrendingUp: Icons.TrendingUp,
  Plus: Icons.Plus,
  Utensils: Icons.Utensils,
  Car: Icons.Car,
  Home: Icons.Home,
  Heart: Icons.Heart,
  GraduationCap: Icons.GraduationCap,
  Gamepad2: Icons.Gamepad2,
  ShoppingBag: Icons.ShoppingBag,
  Receipt: Icons.Receipt,
  MoreHorizontal: Icons.MoreHorizontal,
  LineChart: Icons.LineChart,
  Bitcoin: Icons.Bitcoin,
  Lock: Icons.Lock,
  Building: Icons.Building,
  CircleDot: Icons.CircleDot,
  Wallet: Icons.Wallet,
  CreditCard: Icons.CreditCard,
  Banknote: Icons.Banknote,
  PiggyBank: Icons.PiggyBank,
  DollarSign: Icons.DollarSign,
  Target: Icons.Target,
  Settings: Icons.Settings,
  Menu: Icons.Menu,
  X: Icons.X,
  ChevronLeft: Icons.ChevronLeft,
  ChevronRight: Icons.ChevronRight,
  Calendar: Icons.Calendar,
  Trash2: Icons.Trash2,
  Edit2: Icons.Edit2,
  ArrowUpRight: Icons.ArrowUpRight,
  ArrowDownRight: Icons.ArrowDownRight,
  TrendingDown: Icons.TrendingDown,
  BarChart3: Icons.BarChart3,
  PieChart: Icons.PieChart,
  AlertTriangle: Icons.AlertTriangle,
  Check: Icons.Check,
  Coffee: Icons.Coffee,
  Plane: Icons.Plane,
  Gift: Icons.Gift,
  Phone: Icons.Phone,
  Wifi: Icons.Wifi,
  Tv: Icons.Tv,
  Music: Icons.Music,
  Book: Icons.Book,
  Dumbbell: Icons.Dumbbell,
  Pill: Icons.Pill,
  Scissors: Icons.Scissors,
  Sparkles: Icons.Sparkles,
};

export const DynamicIcon = forwardRef<SVGSVGElement, DynamicIconProps>(
  ({ name, ...props }, ref) => {
    const IconComponent = iconMap[name] || Icons.CircleDot;
    return <IconComponent ref={ref} {...props} />;
  }
);

DynamicIcon.displayName = 'DynamicIcon';
