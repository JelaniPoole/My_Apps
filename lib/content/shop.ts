import type { ShopItem } from "./types";

export const shopItems: ShopItem[] = [
  {
    id: "title_shadow_recruit",
    title: "Shadow Recruit",
    description: "A title for hunters just beginning to awaken.",
    cost: 30,
    icon: "moon",
    color: "#64D2FF",
    category: "title",
    unlockValue: "Shadow Recruit",
  },
  {
    id: "title_gatebreaker",
    title: "Gatebreaker",
    description: "A sharper title for hunters who clear content aggressively.",
    cost: 55,
    icon: "flash",
    color: "#FF8A5B",
    category: "title",
    unlockValue: "Gatebreaker",
  },
  {
    id: "title_monarch_heir",
    title: "Monarch Heir",
    description: "A rare title for players chasing a darker power fantasy.",
    cost: 85,
    icon: "diamond",
    color: "#FF2D55",
    category: "title",
    unlockValue: "Monarch Heir",
  },
  {
    id: "title_archive_watcher",
    title: "Archive Watcher",
    description: "A colder title for hunters who read the battlefield carefully.",
    cost: 70,
    icon: "eye",
    color: "#9B8CFF",
    category: "title",
    unlockValue: "Archive Watcher",
  },
  {
    id: "title_gate_cartographer",
    title: "Gate Cartographer",
    description: "A field title for hunters who never lose the path forward.",
    cost: 65,
    icon: "compass",
    color: "#64D2FF",
    category: "title",
    unlockValue: "Gate Cartographer",
  },
  {
    id: "title_raid_oracle",
    title: "Raid Oracle",
    description: "Reserved for players who keep reading encounters faster than they break.",
    cost: 95,
    icon: "sparkles",
    color: "#FFD166",
    category: "title",
    unlockValue: "Raid Oracle",
  },
  {
    id: "frame_neon_hunt",
    title: "Neon Hunt Frame",
    description: "Bright cyan framing for a cleaner hunter profile.",
    cost: 40,
    icon: "square-outline",
    color: "#64D2FF",
    category: "frame",
    unlockValue: "neon",
  },
  {
    id: "frame_ember_guard",
    title: "Ember Guard Frame",
    description: "Burning orange profile trim for a more dangerous look.",
    cost: 60,
    icon: "flame",
    color: "#FF8A5B",
    category: "frame",
    unlockValue: "ember",
  },
  {
    id: "frame_abyssal_ring",
    title: "Abyssal Ring",
    description: "A violet-black frame that feels closer to the shadow side of the System.",
    cost: 75,
    icon: "ellipse-outline",
    color: "#9B8CFF",
    category: "frame",
    unlockValue: "abyssal",
  },
  {
    id: "frame_verdant_sigil",
    title: "Verdant Sigil",
    description: "A vivid green ring for hunters growing through steady mastery.",
    cost: 55,
    icon: "leaf",
    color: "#7CFF4F",
    category: "frame",
    unlockValue: "verdant",
  },
  {
    id: "frame_gold_command",
    title: "Gold Command Frame",
    description: "A polished command frame built for high-rank profiles.",
    cost: 95,
    icon: "trophy",
    color: "#FFD166",
    category: "frame",
    unlockValue: "gold",
  },
  {
    id: "theme_shadowcore",
    title: "Shadowcore Terminal",
    description: "Dark purple-black shell with cold blue prompt glow.",
    cost: 45,
    icon: "terminal",
    color: "#8B5CF6",
    category: "theme",
    unlockValue: "shadowcore",
    preview: "hunter@system:~$ shadows rise",
  },
  {
    id: "theme_frostbyte",
    title: "Frostbyte Terminal",
    description: "Icy cyan terminal theme with crisp output contrast.",
    cost: 55,
    icon: "snow",
    color: "#64D2FF",
    category: "theme",
    unlockValue: "frostbyte",
    preview: "hunter@system:~$ scan complete",
  },
  {
    id: "theme_emberline",
    title: "Emberline Terminal",
    description: "Heat-tinted terminal styling with fiery command feedback.",
    cost: 65,
    icon: "flame",
    color: "#FF8A5B",
    category: "theme",
    unlockValue: "emberline",
    preview: "hunter@system:~$ ignition ready",
  },
  {
    id: "theme_voidglass",
    title: "Voidglass Terminal",
    description: "A polished violet theme with bright silver output and cold command lines.",
    cost: 78,
    icon: "moon",
    color: "#9B8CFF",
    category: "theme",
    unlockValue: "voidglass",
    preview: "hunter@system:~$ eclipse online",
  },
  {
    id: "theme_monarch_blue",
    title: "Monarch Blue Terminal",
    description: "A premium blue-black command surface inspired by system scans and shadow authority.",
    cost: 90,
    icon: "planet",
    color: "#5DAEFF",
    category: "theme",
    unlockValue: "monarchblue",
    preview: "hunter@system:~$ authority granted",
  },
  {
    id: "theme_verdant_echo",
    title: "Verdant Echo Terminal",
    description: "A green-tinted terminal tuned for clean command feedback and calm readability.",
    cost: 68,
    icon: "leaf",
    color: "#7CFF4F",
    category: "theme",
    unlockValue: "verdantecho",
    preview: "hunter@system:~$ path stabilized",
  },
];

export const defaultOwnedTitles = ["Novice"];
export const defaultOwnedFrames = ["default"];
export const defaultOwnedThemes = ["default"];

export interface TerminalThemePreview {
  background: string;
  inputBg: string;
  border: string;
  prompt: string;
  input: string;
  output: string;
  error: string;
  success: string;
  placeholder: string;
}

export interface TrackCosmeticReward {
  trackName: string;
  category: "title" | "frame" | "theme";
  unlockValue: string;
  label: string;
  color: string;
}

export function getFrameColor(frameId: string, fallback: string) {
  switch (frameId) {
    case "neon":
      return "#64D2FF";
    case "ember":
      return "#FF8A5B";
    case "abyssal":
      return "#9B8CFF";
    case "verdant":
      return "#7CFF4F";
    case "gold":
      return "#FFD166";
    default:
      return fallback;
  }
}

export function getTerminalThemePreview(themeId: string): TerminalThemePreview {
  switch (themeId) {
    case "shadowcore":
      return {
        background: "#090811",
        inputBg: "#110F1B",
        border: "#352759",
        prompt: "#64D2FF",
        input: "#B794F4",
        output: "#F3F5FF",
        error: "#FF6B7D",
        success: "#7CFF4F",
        placeholder: "#5E5578",
      };
    case "frostbyte":
      return {
        background: "#07131A",
        inputBg: "#0B1C24",
        border: "#1E5362",
        prompt: "#8BE9FD",
        input: "#64D2FF",
        output: "#DDF7FF",
        error: "#FF7A8A",
        success: "#A3FFCC",
        placeholder: "#5D8592",
      };
    case "emberline":
      return {
        background: "#140B09",
        inputBg: "#1E110E",
        border: "#5B2F24",
        prompt: "#FFB800",
        input: "#FF8A5B",
        output: "#FFE9DE",
        error: "#FF6B7D",
        success: "#FFD166",
        placeholder: "#9B6B5F",
      };
    case "voidglass":
      return {
        background: "#0B0912",
        inputBg: "#120F1E",
        border: "#4A3A74",
        prompt: "#C3B5FF",
        input: "#9B8CFF",
        output: "#F1EEFF",
        error: "#FF7A8A",
        success: "#B8FFDA",
        placeholder: "#776C98",
      };
    case "monarchblue":
      return {
        background: "#071019",
        inputBg: "#0D1824",
        border: "#275B88",
        prompt: "#7FD8FF",
        input: "#5DAEFF",
        output: "#E5F2FF",
        error: "#FF8698",
        success: "#86FFD8",
        placeholder: "#6483A0",
      };
    case "verdantecho":
      return {
        background: "#08110A",
        inputBg: "#0E1811",
        border: "#2E5A34",
        prompt: "#B8FFDA",
        input: "#7CFF4F",
        output: "#E7FFE9",
        error: "#FF7A8A",
        success: "#C8FF80",
        placeholder: "#6F8B73",
      };
    default:
      return {
        background: "#0A0E14",
        inputBg: "#0D121A",
        border: "#222B3A",
        prompt: "#64D2FF",
        input: "#7CFF4F",
        output: "#E8EEF8",
        error: "#FF6B7D",
        success: "#7CFF4F",
        placeholder: "#64748B",
      };
  }
}

const trackCosmeticRewards: TrackCosmeticReward[] = [
  {
    trackName: "Navigation",
    category: "title",
    unlockValue: "Gate Cartographer",
    label: "Gate Cartographer",
    color: "#64D2FF",
  },
  {
    trackName: "Files",
    category: "frame",
    unlockValue: "ember",
    label: "Ember Guard Frame",
    color: "#FF8A5B",
  },
  {
    trackName: "Viewing",
    category: "title",
    unlockValue: "Archive Watcher",
    label: "Archive Watcher",
    color: "#9B8CFF",
  },
  {
    trackName: "Pipes & Text",
    category: "theme",
    unlockValue: "verdantecho",
    label: "Verdant Echo Terminal",
    color: "#7CFF4F",
  },
  {
    trackName: "System",
    category: "theme",
    unlockValue: "monarchblue",
    label: "Monarch Blue Terminal",
    color: "#5DAEFF",
  },
  {
    trackName: "Git",
    category: "frame",
    unlockValue: "abyssal",
    label: "Abyssal Ring",
    color: "#9B8CFF",
  },
  {
    trackName: "Logs",
    category: "title",
    unlockValue: "Raid Oracle",
    label: "Raid Oracle",
    color: "#FFD166",
  },
];

export function getTrackCosmeticReward(trackName: string) {
  return trackCosmeticRewards.find((reward) => reward.trackName === trackName) ?? null;
}
