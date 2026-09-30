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

/* -------------------------------------------------------------------------- */
/* Data surface                                                                */
/* -------------------------------------------------------------------------- */
/**
 * The glyphs a data-heavy surface needs and the three groups above did not
 * cover. Every one of them is here because a component in the audit's kill list
 * has no icon without it — the set was derived from the components, not from
 * what lucide happens to ship.
 *
 *  - `ArrowUpDown` / `ListFilter` / `Funnel` are the three affordances of a
 *    table: sort, filter row, filter menu. An audit found 13 different ways to draw
 *    the first two.
 *  - `Columns3` / `Rows3` / `GripVertical` are a column-visibility control, a
 *    density control and a drag handle. None existed.
 *  - `BadgeCheck` is a *verified* state, which is neither the existing
 *    `CircleCheck` (healthy) nor a tone. Conflating it with `CircleCheck` is how
 *    a "signed by the CA" certificate starts reading as "the service is up".
 *  - `Binary` is the one that bit the audit: a file manager offered `KB` and
 *    `KiB` in the same column with no way to say which was in use.
 */
export {
  ArrowUpDown,
  Columns3,
  Rows3,
  GripVertical,
  ListFilter,
  Funnel,
  Eraser,
  BadgeCheck,
  Binary,
  Sigma,
  Braces,
  ScrollText,
  DatabaseBackup,
  FileWarning,
  CirclePause,
  CircleSlash,
  CircleDot,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Infrastructure                                                              */
/* -------------------------------------------------------------------------- */
/**
 * Both source products run homelab and infrastructure software, and neither had
 * these in its icon set — so both drew them or went without. The set is the
 * vocabulary of the domain TEA UI now serves, and it is deliberately not
 * open-ended: a fourth TEA product should find what it needs here rather than
 * reaching for `lucide-react` and shipping 1600 icons into the module graph.
 *
 * `Router`/`Network`/`Server`/`HardDrive` are the physical layer, `Container`/
 * `Boxes` the virtual one, and the rest is the surface a homelab panel is made
 * of: domains, deployments, recurring jobs, automation, monitoring.
 */
export {
  Globe,
  Rocket,
  GitBranch,
  Repeat,
  Workflow,
  Plug,
  Webhook,
  Mailbox,
  Inbox,
  Anchor,
  Blocks,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Diagnostics, health, security                                               */
/* -------------------------------------------------------------------------- */
/**
 * `CONSOLIDATION.md` §5 recorded four pages in one product that used **emoji**
 * instead of a status icon — a green circle here, a warning triangle there, each
 * with its own colour. An emoji is not a status: it is a pictogram that renders
 * differently per platform, cannot inherit `currentColor`, and is read out
 * literally by a screen reader. The status glyphs themselves already ship in the
 * Status group above, so what is added here is only what was missing: a scan, an
 * alarm, an identity, a support channel, and a defect.
 *
 * `Radar` and `Siren` are separate on purpose. `TriangleAlert` says something is
 * wrong *now*; `Siren` says something is wrong across a fleet. Collapsing them
 * is how a monitoring overview ends up as good as its worst single host.
 */
export { Radar, Siren, Fingerprint, LifeBuoy, Bug } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Appearance                                                                  */
/* -------------------------------------------------------------------------- */
/**
 * TEA UI is dark-only and `prefers-color-scheme` is not a TEA UI feature — a
 * second untested palette is a second untested palette, and the token
 * architecture is colour-scheme ready instead. These three are therefore *not*
 * a theme switch: they are the affordance a **product** renders when it offers
 * a light mode of its own, and a product that does not offer one must not render
 * them. Shipping them is not a decision to add a light theme to TEA UI.
 */
export { Sun, Moon, Contrast } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* Construction                                                                */
/* -------------------------------------------------------------------------- */
/**
 * Building, experimenting and instrumenting — the vocabulary of a product that
 * is itself under construction, which is the normal state of a TEA product
 * during an audit-driven migration. `Hammer` is a build; `FlaskConical` is an
 * experiment and must not be used for either.
 */
export { Hammer, FlaskConical, WandSparkles, Brain, Thermometer, Weight, QrCode, Signature, ZoomIn } from "lucide-react";

