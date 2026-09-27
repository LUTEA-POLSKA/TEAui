/**
 * TEA UI — the icon surface.
 *
 * Both source projects imported `lucide-react` wholesale, which put ~1600
 * icons in a module graph that no product ever used. This package is a
 * *curated, named* subset instead: about 90 icons, grouped by the job they do,
 * each with a TEA name that describes intent rather than shape.
 *
 * Why this matters beyond bundle size: a named subset is a *governed* set. A
 * product cannot accidentally invent a 91st icon, and when the design language
 * changes, the change lands in one file. `ICON-SET.md` is the human-readable
 * version of this contract.
 *
 * Every export is a direct named re-export, so bundlers can tree-shake it.
 * There is deliberately no `export *` and no barrel-of-barrels.
 */

export type { LucideIcon, LucideProps } from "lucide-react";

export { TeaMark, type TeaMarkProps } from "./tea-mark";

/* -------------------------------------------------------------------------- */
/* Action                                                                      */
/* -------------------------------------------------------------------------- */
export {
  Check,
  X,
  Plus,
  Minus,
  Pencil,
  Trash2,
  Copy,
  ClipboardCopy,
  Download,
  Upload,
  Save,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  Settings,
  SlidersHorizontal,
  MoreHorizontal,
  MoreVertical,
  Undo2,
  Redo2,
  ExternalLink,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Navigation                                                                  */
/* -------------------------------------------------------------------------- */
export {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Home,
  PanelLeft,
  Menu,
  Compass,
  MapPin,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Status                                                                      */
/* -------------------------------------------------------------------------- */
export {
  CircleCheck,
  CircleAlert,
  CircleX,
  CircleDashed,
  CircleHelp,
  TriangleAlert,
  OctagonAlert,
  Info,
  Clock,
  Hourglass,
  ShieldCheck,
  ShieldAlert,
  Ban,
  Lock,
  KeyRound,
  Wifi,
  WifiOff,
  CloudOff,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Data                                                                        */
/* -------------------------------------------------------------------------- */
export {
  Activity,
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Database,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Gauge,
  ChartNoAxesColumn,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Files                                                                       */
/* -------------------------------------------------------------------------- */
export {
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  FileArchive,
  Folder,
  FolderOpen,
  FolderPlus,
  FilePlus,
  UploadCloud,
  Paperclip,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Media                                                                       */
/* -------------------------------------------------------------------------- */
export { Play, Pause, Square, SkipForward, Volume2, Image, Video, Film, Camera } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Communication                                                               */
/* -------------------------------------------------------------------------- */
export { Mail, MessageSquare, Bell, BellOff, Send, Phone, Share2, Link2, AtSign } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Commerce                                                                    */
/* -------------------------------------------------------------------------- */
export { CreditCard, Receipt, Wallet, ShoppingCart, Tag, Percent, Banknote } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Device                                                                      */
/* -------------------------------------------------------------------------- */
export { Monitor, Smartphone, Tablet, Laptop, Terminal, Power, Package, Boxes, Container } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Editor                                                                      */
/* -------------------------------------------------------------------------- */
export { Bold, Italic, Underline, Strikethrough, ListOrdered, Quote, Code2, Type } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Time                                                                        */
/* -------------------------------------------------------------------------- */
export { Calendar, CalendarClock, Timer, History, ArrowRightLeft } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Misc                                                                        */
/* -------------------------------------------------------------------------- */
export {
  SearchX,
  ServerCrash,
  Sparkles,
  Lightbulb,
  Wrench,
  Cog,
  Users,
  User,
  UserPlus,
  Layers,
  Grid3x3,
  Table2,
  Palette,
  Zap,
  Star,
  Bookmark,
  ThumbsUp,
} from "lucide-react";
