export type ColorKey =
  | "accentColor"
  | "headerBg"
  | "chatHeaderBg"
  | "chatBg"
  | "chatInputBg"
  | "chatInputText"
  | "promptBg"
  | "promptText"
  | "userMsgBg"
  | "userMsgText"
  | "assistantReplyBg"
  | "assistantReplyText";

export interface Colors {
  accentColor: string;
  headerBg: string;
  chatHeaderBg: string;
  chatBg: string;
  chatInputBg: string;
  chatInputText: string;
  promptBg: string;
  promptText: string;
  userMsgBg: string;
  userMsgText: string;
  assistantReplyBg: string;
  assistantReplyText: string;
}

export interface AppConfig {
  appTitle: string;
  mapItemId: string;
  chatHeading: string;
  chatDescription: string;
  colors: Colors;
  fontFamily: string;
  suggestedPrompts: string[];
  logoUrl: string;
}
