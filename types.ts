export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  type?: NoteType;
  tags?: string[];
  isTask?: boolean;
  dueDate?: string;
  image?: string; // base64 encoded image
}

export enum NoteType {
  GENERAL = "عام",
  MEETING = "اجتماع",
  IDEA = "فكرة",
  TASK = "مهمة",
  JOURNAL = "يوميات",
}

export interface MeetingDetails {
  type: string;
  attendees: string;
  proposedTime: string;
  inviteBody?: string;
}

export interface AISuggestion {
  type: AISuggestionType;
  data: string | string[] | MeetingDetails | NoteType | { summary: string, actionItems?: string[] };
}

export enum AISuggestionType {
  TITLE = "عنوان مقترح",
  REPHRASE = "إعادة صياغة",
  SUMMARY = "ملخص",
  NOTE_TYPE = "نوع الملاحظة",
  MEETING_INVITE = "دعوة اجتماع",
  DOCUMENT_DRAFT = "مسودة مستند",
  PLAN = "خطة تنفيذ",
  MEETING_MINUTES = "محضر اجتماع",
  IMPROVE_WRITING = "تحسين الكتابة",
  MAKE_SHORTER = "جعله أقصر",
  ADD_KEY_POINT = "إضافة نقطة رئيسية",
  CREATE_MEETING_FROM_NOTE = "إنشاء اجتماع من الملاحظة",
  GENERATE_MEETING_INVITATION_CONTEXTUAL = "إنشاء دعوة اجتماع سياقية",
}

export interface GeneratedDoc {
  title: string;
  content: string;
}

// For Speech Recognition API
export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  readonly isFinal: boolean;
  // Allow array-like access for convenience as it's often used this way
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  // Allow array-like access for convenience
  [index: number]: SpeechRecognitionResult;
}

export interface ISpeechRecognitionEvent { // Corresponds to the event object in onresult
  results: SpeechRecognitionResultList;
  resultIndex: number; // Index of the current result in the results list
  // Other properties like emma, interpretation can be added if needed
}

export interface ISpeechRecognitionErrorEvent { // Corresponds to the event object in onerror
  error: string; // The type of error (e.g., 'no-speech', 'audio-capture', 'network')
  message: string; // A human-readable description of the error
}

export interface ISpeechRecognition extends EventTarget {
  grammars: any; // Type is SpeechGrammarList, using 'any' for simplicity if not deeply typed
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;

  start(): void;
  stop(): void;
  abort(): void;

  onaudiostart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onsoundend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onaudioend: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
  onnomatch: ((this: ISpeechRecognition, ev: ISpeechRecognitionEvent) => any) | null;
  onerror: ((this: ISpeechRecognition, ev: ISpeechRecognitionErrorEvent) => any) | null;
  onstart: ((this: ISpeechRecognition, ev: Event) => any) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => any) | null;
}