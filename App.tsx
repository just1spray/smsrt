
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, NoteType, AISuggestion, MeetingDetails, GeneratedDoc, AISuggestionType, ISpeechRecognition, ISpeechRecognitionEvent, ISpeechRecognitionErrorEvent } from './types';
import { DEFAULT_NOTE_TITLE } from './constants';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import AssistantPanel from './components/AssistantPanel';
import Header from './components/Header';
import Modal from './components/Modal';
import { generateContent, startChat } from './services/geminiService'; // Ensured this path is relative
import { GoogleGenAI, Chat } from '@google/genai'; // Ensure GoogleGenAI is imported for type if needed indirectly

const App: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>(() => {
    const savedNotes = localStorage.getItem('smart-notes');
    return savedNotes ? JSON.parse(savedNotes) : [];
  });
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const speechRecognitionRef = useRef<ISpeechRecognition | null>(null);

  const [showMeetingModal, setShowMeetingModal] = useState<boolean>(false);
  const [meetingChat, setMeetingChat] = useState<Chat | null>(null);
  const [meetingMessages, setMeetingMessages] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
  const [currentMeetingDetails, setCurrentMeetingDetails] = useState<Partial<MeetingDetails>>({});
  const meetingModalUserInputRef = useRef<HTMLInputElement>(null);

  const [showGeneratedDocModal, setShowGeneratedDocModal] = useState<boolean>(false);
  const [generatedDocument, setGeneratedDocument] = useState<GeneratedDoc | null>(null);

  useEffect(() => {
    localStorage.setItem('smart-notes', JSON.stringify(notes));
  }, [notes]);

  const selectedNote = notes.find(note => note.id === selectedNoteId) || null;

  const handleAddNote = useCallback(() => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: DEFAULT_NOTE_TITLE,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: NoteType.GENERAL,
    };
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setSelectedNoteId(newNote.id);
    setAiSuggestions([]);
  }, []);

  const handleSelectNote = useCallback((id: string) => {
    setSelectedNoteId(id);
    setAiSuggestions([]); // Clear suggestions when selecting a new note
  }, []);

  const handleUpdateNote = useCallback((updatedNote: Note) => {
    setNotes(prevNotes =>
      prevNotes.map(note => (note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : note))
    );
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(notes.length > 1 && notes[0] ? notes[0].id : null);
      setAiSuggestions([]);
    }
  }, [selectedNoteId, notes]);
  
  const handleAISuggestion = useCallback(async (action: string, data?: string | { type: string } | File) => {
    if (!selectedNote && !['createMeeting', 'processVoiceCommandForMeeting', 'createMeetingFromNote', 'generateMeetingInvitationContextual'].includes(action)) return;
    
    setIsLoading(true);
    setError(null);
    // Keep existing suggestions unless it's a major context shift
    // setAiSuggestions([]); 

    try {
      let prompt = "";
      let newSuggestion: AISuggestion | null = null;
      const currentNoteContent = selectedNote?.content || "";
      const currentNoteTitle = selectedNote?.title || "";


      if (action === 'suggestTitle' && selectedNote) {
        prompt = `اقترح عنوانًا موجزًا وجذابًا لهذه الملاحظة:\n\n${currentNoteContent}`;
        const title = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.TITLE, data: title };
      } else if (action === 'rephraseText' && selectedNote && typeof data === 'string') {
        prompt = `أعد صياغة هذا النص ليكون أكثر وضوحًا وإيجازًا أو احترافية:\n\n${data}`;
        const rephrased = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.REPHRASE, data: rephrased };
      } else if (action === 'summarizeText' && selectedNote) {
        prompt = `لخص هذه الملاحظة، مع إبراز النقاط الرئيسية وأية عناصر قابلة للتنفيذ:\n\n${currentNoteContent}`;
        const summaryAndActionsPrompt = `لخص النص التالي وحدد أي عناصر عمل قابلة للتنفيذ:\n\n${currentNoteContent}\n\nقم بالرد بتنسيق JSON: {"summary": "الملخص هنا", "actionItems": ["مهمة 1", "مهمة 2"]}`;
        const structuredSummaryResponse = await generateContent(summaryAndActionsPrompt, true);
        
        let parsedSummaryData = { summary: await generateContent(prompt), actionItems: [] as string[] }; // Fallback summary
        if (structuredSummaryResponse) {
           try {
            parsedSummaryData = JSON.parse(structuredSummaryResponse) as { summary: string; actionItems: string[] };
           } catch (e) { console.warn("Failed to parse structured summary", e); }
        }
        newSuggestion = { type: AISuggestionType.SUMMARY, data: parsedSummaryData };
      } else if (action === 'classifyNoteType' && selectedNote) {
        const types = Object.values(NoteType).join(', ');
        prompt = `صنف نوع هذه الملاحظة (اختر من: ${types}):\n\n${currentNoteContent}`;
        const typeName = await generateContent(prompt);
        const matchedType = Object.values(NoteType).find(t => typeName.includes(t)) || NoteType.GENERAL;
        newSuggestion = { type: AISuggestionType.NOTE_TYPE, data: matchedType };
        if (selectedNote) handleUpdateNote({...selectedNote, type: matchedType });
      } else if (action === 'createMeeting' || action === 'createMeetingFromNote') {
        setShowMeetingModal(true);
        const initialPrompt = action === 'createMeetingFromNote' && selectedNote ? 
            `أنت مساعد لتنظيم الاجتماعات. المستخدم يريد إنشاء اجتماع بناء على الملاحظة التالية: "${currentNoteTitle}\n${currentNoteContent}". اطرح الأسئلة اللازمة لجمع التفاصيل (نوع الاجتماع، الحضور، الموعد المقترح). ابدأ بسؤال عن نوع الاجتماع.`
            : "أنت مساعد لتنظيم الاجتماعات. سأطلب منك ترتيب اجتماع. اطرح عليّ الأسئلة اللازمة خطوة بخطوة لجمع التفاصيل (نوع الاجتماع، الحضور، الموعد المقترح).";
        const chatInstance = startChat(initialPrompt);
        setMeetingChat(chatInstance);
        const firstQuestion = action === 'createMeetingFromNote' && selectedNote ? `بناءً على ملاحظتك "${currentNoteTitle}", ما هو نوع الاجتماع الذي تود عقده؟` : 'بالتأكيد! لمساعدتك في ترتيب الاجتماع، ما هو نوع الاجتماع الذي تود عقده؟';
        setMeetingMessages([{ sender: 'ai', text: firstQuestion }]);
        setCurrentMeetingDetails({});
        return; 
      } else if (action === 'developIdea' && selectedNote) {
        prompt = `طوّر هذه الفكرة الأولية إلى خطة تنفيذ مقترحة مع خطوات رئيسية:\n\n${currentNoteContent}`;
        const plan = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.PLAN, data: plan };
      } else if (action === 'generateMeetingMinutes' && selectedNote && selectedNote.type === NoteType.MEETING) {
         prompt = `بناءً على نقاط الاجتماع التالية، قم بإنشاء محضر اجتماع رسمي:\n\n${currentNoteContent}\n\nتأكد من تضمين الحضور (إذا ذكر)، القرارات الرئيسية، وعناصر العمل مع المسؤولين (إذا أمكن).`;
         const minutes = await generateContent(prompt);
         newSuggestion = { type: AISuggestionType.MEETING_MINUTES, data: minutes };
      } else if (action === 'generateDocument' && selectedNote && typeof data === 'object' && 'type' in data) {
          const docType = (data as {type: string}).type;
          prompt = `بناءً على الملاحظات التالية، قم بإنشاء ${docType}:\n\n${currentNoteContent}\n\nاجعل المستند احترافيًا وشاملاً.`;
          const docContent = await generateContent(prompt);
          setGeneratedDocument({title: `${docType} - ${currentNoteTitle}`, content: docContent});
          setShowGeneratedDocModal(true);
          return; 
      } else if (action === 'processVoiceCommandForMeeting' && typeof data === 'string') {
          setShowMeetingModal(true);
          const chatInstance = startChat("أنت مساعد لتنظيم الاجتماعات. المستخدم ذكر: " + data + ". ابدأ بطرح الأسئلة لجمع التفاصيل.");
          setMeetingChat(chatInstance);
          setMeetingMessages([{ sender: 'ai', text: `فهمت أنك تريد ترتيب اجتماع بناءً على قولك: "${data}". ما هو نوع الاجتماع؟`}]);
          setCurrentMeetingDetails({});
          return;
      } else if (action === 'improveWriting' && selectedNote) {
        prompt = `أعد صياغة النص التالي لتحسين وضوحه وإيجازه وجودته العامة. قدم فقط النص المُعاد صياغته:\n\n${data || currentNoteContent}`;
        const improvedText = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.IMPROVE_WRITING, data: improvedText };
        // Optionally update note content directly, or let user copy/paste
        // handleUpdateNote({ ...selectedNote, content: improvedText });
      } else if (action === 'makeShorter' && selectedNote) {
        prompt = `اجعل النص التالي أقصر مع الحفاظ على المعنى الأساسي. قدم فقط النص المختصر:\n\n${data || currentNoteContent}`;
        const shorterText = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.MAKE_SHORTER, data: shorterText };
      } else if (action === 'addKeyPoint' && selectedNote) {
        // This could be more interactive, e.g., ask user for the key point.
        // For now, let's suggest a point or ask Gemini to integrate something.
        prompt = `حلل النص التالي واقترح نقطة رئيسية هامة يمكن إضافتها أو توسيعها، أو قم بدمج نقطة رئيسية ذات صلة بالموضوع:\n\n${currentNoteContent}`;
        const keyPointSuggestion = await generateContent(prompt);
        newSuggestion = { type: AISuggestionType.ADD_KEY_POINT, data: keyPointSuggestion };
      } else if (action === 'generateMeetingInvitationContextual' && selectedNote) {
        prompt = `بناءً على الملاحظة التالية، قم بإنشاء مسودة دعوة اجتماع احترافية. استخلص التفاصيل ذات الصلة مثل الموضوع، وبنود جدول الأعمال المحتملة، والأهداف من الملاحظة. إذا لم تكن التفاصيل كافية، اطلبها:\n\nالعنوان: ${currentNoteTitle}\nالمحتوى: ${currentNoteContent}`;
        const inviteText = await generateContent(prompt);
        newSuggestion = { 
            type: AISuggestionType.MEETING_INVITE, // Use existing for display
            data: { 
                type: "اجتماع مُقترح", 
                attendees: "المعنيين (بحسب الملاحظة)", 
                proposedTime: "يُحدد لاحقاً (بحسب الملاحظة)", 
                inviteBody: inviteText 
            }
        };
      }


      if (newSuggestion) {
        setAiSuggestions(prev => [newSuggestion, ...prev.slice(0,4)]); // Keep last 5 suggestions
      }

    } catch (e: any) {
      console.error("AI suggestion error:", e);
      setError(`خطأ في جلب اقتراح الذكاء الاصطناعي: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNote, handleUpdateNote, meetingChat]);

  const handleMeetingModalSubmit = async (userInput: string) => {
    if (!meetingChat || !userInput.trim()) return;
    setIsLoading(true);
    setMeetingMessages(prev => [...prev, { sender: 'user', text: userInput }]);
    
    try {
      const response = await meetingChat.sendMessage({ message: userInput });
      const aiResponseText = response.text;
      setMeetingMessages(prev => [...prev, { sender: 'ai', text: aiResponseText }]);

      // Simplified logic for detail gathering
      if (!currentMeetingDetails.type && userInput) {
         setCurrentMeetingDetails(prev => ({ ...prev, type: userInput }));
      } else if (currentMeetingDetails.type && !currentMeetingDetails.attendees && userInput) {
        setCurrentMeetingDetails(prev => ({ ...prev, attendees: userInput }));
      } else if (currentMeetingDetails.type && currentMeetingDetails.attendees && !currentMeetingDetails.proposedTime && userInput) {
        setCurrentMeetingDetails(prev => ({ ...prev, proposedTime: userInput }));
      }
      
      if (aiResponseText.includes("صياغة دعوة") || (currentMeetingDetails.type && currentMeetingDetails.attendees && currentMeetingDetails.proposedTime)) {
        const meetingPrompt = `
        أنشئ دعوة اجتماع احترافية بالتفاصيل التالية:
        نوع الاجتماع: ${currentMeetingDetails.type}
        الحضور: ${currentMeetingDetails.attendees}
        الموعد المقترح: ${currentMeetingDetails.proposedTime}
        ${selectedNote ? `استخدم الملاحظة التالية كمرجع إضافي للسياق وجدول الأعمال المقترح إذا كان ذلك مناسبًا: "${selectedNote.title}\n${selectedNote.content}"` : ""}
        الرجاء تضمين جدول أعمال مقترح إذا كان ذلك مناسبًا لنوع الاجتماع.
        `;
        const inviteText = await generateContent(meetingPrompt);
        setAiSuggestions([{ type: AISuggestionType.MEETING_INVITE, data: {type: currentMeetingDetails.type!, attendees: currentMeetingDetails.attendees!, proposedTime: currentMeetingDetails.proposedTime!, inviteBody: inviteText} }]);
        
        const newMeetingNote: Note = {
          id: Date.now().toString(),
          title: `اجتماع: ${currentMeetingDetails.type}`,
          content: `دعوة الاجتماع:\n${inviteText}\n\nالحضور: ${currentMeetingDetails.attendees}\nالموعد: ${currentMeetingDetails.proposedTime}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          type: NoteType.MEETING,
          tags: ['اجتماع', currentMeetingDetails.type || 'عام'],
        };
        setNotes(prev => [newMeetingNote, ...prev]);
        setShowMeetingModal(false);
        setMeetingMessages([]);
        setMeetingChat(null);
      }
    } catch (e: any) {
      console.error("Meeting chat error:", e);
      setMeetingMessages(prev => [...prev, { sender: 'ai', text: `حدث خطأ: ${e.message}` }]);
    } finally {
      setIsLoading(false);
      if (meetingModalUserInputRef.current) meetingModalUserInputRef.current.value = "";
    }
  };

  const handleVoiceCommand = useCallback((command: string) => {
    command = command.trim().toLowerCase();
    console.log("Comando de voz recibido:", command);

    if (command.includes("ملاحظة جديدة") || command.includes("تدوين ملاحظة")) {
      handleAddNote();
      const contentToSet = command.replace("ملاحظة جديدة", "").replace("تدوين ملاحظة", "").trim();
      // selectedNoteId is set by handleAddNote, but its effect might not be immediate for the current render cycle.
      // We rely on the fact that selectedNote will update in the next render, or pass ID.
      // For now, let's find the newly added note (assuming it's the first one).
      setTimeout(() => {
        setNotes(prev => {
            const newNoteId = prev[0]?.id; // Potentially fragile if sorting changes
            return prev.map(n => n.id === newNoteId ? {...n, content: contentToSet, title: contentToSet.substring(0,30) || DEFAULT_NOTE_TITLE} : n)
        });
       }, 0);

    } else if (command.includes("لخص الملاحظة") || command.includes("تلخيص")) {
      if (selectedNote) handleAISuggestion('summarizeText');
    } else if (command.includes("اقترح عنوان")) {
      if (selectedNote) handleAISuggestion('suggestTitle');
    } else if (command.includes("رتب اجتماع") || command.includes("أريد ترتيب اجتماع")) {
       handleAISuggestion('processVoiceCommandForMeeting', command);
    } else if (selectedNote) { 
        handleUpdateNote({ ...selectedNote, content: `${selectedNote.content}\n${command}` });
    } else {
        const newNote: Note = {
            id: Date.now().toString(),
            title: command.substring(0,30) || DEFAULT_NOTE_TITLE,
            content: command,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: NoteType.GENERAL,
          };
          setNotes(prevNotes => [newNote, ...prevNotes]);
          setSelectedNoteId(newNote.id);
    }
  }, [handleAddNote, selectedNote, handleAISuggestion, handleUpdateNote]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionAPI) {
        setError("متصفحك لا يدعم التعرف على الصوت.");
        return;
      }
      speechRecognitionRef.current = new SpeechRecognitionAPI();
      if (!speechRecognitionRef.current) return;

      speechRecognitionRef.current.lang = 'ar-SA';
      speechRecognitionRef.current.interimResults = false;
      speechRecognitionRef.current.maxAlternatives = 1;

      speechRecognitionRef.current.onresult = (event: ISpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        handleVoiceCommand(transcript);
      };
      speechRecognitionRef.current.onerror = (event: ISpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setError(`خطأ في التعرف على الصوت: ${event.error}`);
        setIsListening(false);
      };
      speechRecognitionRef.current.onend = () => {
        setIsListening(false);
      };
      speechRecognitionRef.current.start();
      setIsListening(true);
      setError(null);
    }
  }, [isListening, handleVoiceCommand]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      if (notes.length > 0 && !selectedNoteId && notes[0]) setSelectedNoteId(notes[0].id);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const foundNotes = notes.filter(note => 
      note.title.toLowerCase().includes(lowerSearchTerm) || 
      note.content.toLowerCase().includes(lowerSearchTerm) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
    );
    if (foundNotes.length > 0 && foundNotes[0]) {
      setSelectedNoteId(foundNotes[0].id);
    } else {
      setError("لم يتم العثور على ملاحظات تطابق بحثك.");
    }
  }, [notes, selectedNoteId]);


  return (
    <div className="flex flex-col h-screen font-[Tajawal,sans-serif] bg-gray-50 text-gray-800">
      <Header 
        onAddNote={handleAddNote} 
        onSearch={handleSearch}
        isListening={isListening}
        onToggleListening={toggleListening}
      />
      <main className="flex flex-1 overflow-hidden pt-16"> {/* pt-16 for fixed header */}
        <div className="w-1/4 xl:w-1/5 bg-gray-100 p-4 overflow-y-auto border-l border-gray-200">
          <NoteList
            notes={notes}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleSelectNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>
        <div className="flex-1 p-6 overflow-y-auto bg-gray-200"> {/* Changed background for contrast */}
          {selectedNote ? (
            <NoteEditor
              key={selectedNote.id} 
              note={selectedNote}
              onUpdateNote={handleUpdateNote}
              onAISuggestion={handleAISuggestion}
              isLoading={isLoading}
              onDone={() => setSelectedNoteId(null)} // Added onDone prop
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <i className="far fa-sticky-note fa-4x mb-4"></i>
              <p className="text-xl">الرجاء تحديد ملاحظة لعرضها أو إنشاء ملاحظة جديدة.</p>
            </div>
          )}
        </div>
        <div className="w-1/4 xl:w-1/5 bg-gray-50 p-4 overflow-y-auto border-r border-gray-200">
          <AssistantPanel suggestions={aiSuggestions} isLoading={isLoading} error={error} />
        </div>
      </main>

      {showMeetingModal && (
        <Modal title="ترتيب اجتماع ذكي" onClose={() => {
          setShowMeetingModal(false); 
          setMeetingChat(null); 
          setMeetingMessages([]);
        }}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2">
            {meetingMessages.map((msg, index) => (
              <div key={index} className={`p-3 rounded-lg ${msg.sender === 'ai' ? 'bg-blue-100 text-blue-800 self-start' : 'bg-green-100 text-green-800 self-end'}`}>
                {msg.text}
              </div>
            ))}
             {isLoading && <div className="text-center text-gray-500">يفكر الذكاء الاصطناعي...</div>}
          </div>
          <div className="mt-4 flex">
            <input 
              ref={meetingModalUserInputRef}
              type="text" 
              className="flex-grow p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="اكتب ردك هنا..."
              onKeyPress={(e) => e.key === 'Enter' && meetingModalUserInputRef.current && handleMeetingModalSubmit(meetingModalUserInputRef.current.value)}
            />
            <button 
              onClick={() => meetingModalUserInputRef.current && handleMeetingModalSubmit(meetingModalUserInputRef.current.value)}
              className="mr-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
              disabled={isLoading}
            >
              إرسال
            </button>
          </div>
        </Modal>
      )}

      {showGeneratedDocModal && generatedDocument && (
        <Modal title={generatedDocument.title} onClose={() => {
          setShowGeneratedDocModal(false);
          setGeneratedDocument(null);
        }}>
          <div className="prose prose-sm max-w-none max-h-[70vh] overflow-y-auto p-2 bg-white rounded-md shadow" dangerouslySetInnerHTML={{ __html: generatedDocument.content.replace(/\n/g, '<br/>') }}>
          </div>
           <button 
              onClick={() => { setShowGeneratedDocModal(false); setGeneratedDocument(null); }}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              إغلاق
            </button>
        </Modal>
      )}

    </div>
  );
};

export default App;
