import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { calculateTestEffort } from '../utils/effort';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Static question banks — 20+ unique questions per category
// ─────────────────────────────────────────────────────────────────────────────
interface Question {
  q: string;
  options: string[];
  answer: string;
  explanation: string;
}

const TENSE_QUESTIONS: Question[] = [
  { q: "She ___ to the store every day.", options: ["go","goes","gone","going"], answer: "goes", explanation: "'goes' is the present simple form for third-person singular subjects." },
  { q: "They ___ playing football when it started to rain.", options: ["are","were","have been","had been"], answer: "were", explanation: "'were playing' is the past continuous — action in progress when another event interrupted." },
  { q: "I ___ finished my homework already.", options: ["have","has","had","am"], answer: "have", explanation: "Present perfect 'have finished' expresses an action completed at an unspecified time before now." },
  { q: "By next year, she ___ here for ten years.", options: ["will work","will have worked","worked","is working"], answer: "will have worked", explanation: "Future perfect describes an action completed before a specific future time." },
  { q: "He ___ dinner when she called.", options: ["had cooked","was cooking","has cooked","cooked"], answer: "was cooking", explanation: "Past continuous expresses an action in progress at the moment of interruption." },
  { q: "I ___ never seen snow before this trip.", options: ["had","have","was","am"], answer: "had", explanation: "Past perfect 'had never seen' describes an experience before a past reference point." },
  { q: "They ___ to the cinema last Sunday.", options: ["go","have gone","went","will go"], answer: "went", explanation: "Simple past is used for completed actions at a specific past time." },
  { q: "She ___ breakfast by 7 AM every morning.", options: ["finishes","finished","is finishing","will finish"], answer: "finishes", explanation: "Present simple is used for habitual actions or routines." },
  { q: "We ___ for the bus for 20 minutes when it finally arrived.", options: ["wait","waited","had been waiting","have waited"], answer: "had been waiting", explanation: "Past perfect continuous emphasises the duration of an action before another past event." },
  { q: "He said he ___ call me the next day.", options: ["will","would","is going to","shall"], answer: "would", explanation: "'would' is the past form of 'will', used in reported speech." },
  { q: "The train ___ already left by the time we reached the station.", options: ["has","had","is","was"], answer: "had", explanation: "Past perfect 'had left' shows the train departed before we arrived." },
  { q: "She ___ a new job next month.", options: ["starts","started","has started","will start"], answer: "will start", explanation: "Future simple 'will start' indicates a future event." },
  { q: "I ___ this book three times already.", options: ["read","reads","have read","had read"], answer: "have read", explanation: "Present perfect 'have read' expresses past experience relevant to now." },
  { q: "They ___ in this city since 2010.", options: ["live","lived","have lived","are living"], answer: "have lived", explanation: "Present perfect with 'since' shows an action that started in the past and continues now." },
  { q: "By the time you arrive, I ___ the food.", options: ["prepare","am preparing","will have prepared","have prepared"], answer: "will have prepared", explanation: "Future perfect indicates an action completed before a future point in time." },
  { q: "He ___ every day when he was a child.", options: ["reads","read","has read","had read"], answer: "read", explanation: "Past simple is used for habits or repeated actions in the past." },
  { q: "She ___ the report by the end of the week.", options: ["submit","will submit","submitted","has submitted"], answer: "will submit", explanation: "Future simple 'will submit' refers to a planned future action." },
  { q: "I ___ him for ages — is he still in London?", options: ["don't see","haven't seen","didn't see","hadn't seen"], answer: "haven't seen", explanation: "Present perfect 'haven't seen' expresses an action that hasn't happened up to now." },
  { q: "While I ___ TV, the lights went out.", options: ["watch","watched","was watching","am watching"], answer: "was watching", explanation: "Past continuous 'was watching' describes an action in progress interrupted by another." },
  { q: "She ___ her keys and couldn't get in.", options: ["loses","lost","has lost","is losing"], answer: "has lost", explanation: "Present perfect 'has lost' shows a recent past action with a present result — she still can't get in." },
];

const PARTS_OF_SPEECH_QUESTIONS: Question[] = [
  { q: "Identify the adjective: 'The tall man entered the room.'", options: ["tall","man","entered","room"], answer: "tall", explanation: "'tall' modifies the noun 'man', making it an adjective." },
  { q: "Which word is an adverb? 'She sings beautifully.'", options: ["She","sings","beautifully","(none)"], answer: "beautifully", explanation: "'beautifully' modifies the verb 'sings', making it an adverb." },
  { q: "Choose the correct preposition: 'He has been here ___ Monday.'", options: ["for","since","during","by"], answer: "since", explanation: "'since' refers to a specific point in time — Monday." },
  { q: "What part of speech is 'and' in 'apples and oranges'?", options: ["Noun","Verb","Conjunction","Preposition"], answer: "Conjunction", explanation: "'and' connects two nouns, so it is a coordinating conjunction." },
  { q: "'Run' in 'Go for a run' is being used as:", options: ["Verb","Noun","Adjective","Adverb"], answer: "Noun", explanation: "Here 'run' acts as a noun — the object of the preposition 'for'." },
  { q: "Identify the verb: 'The children laughed loudly.'", options: ["children","laughed","loudly","The"], answer: "laughed", explanation: "'laughed' is the action performed by the subject." },
  { q: "Which is a conjunction? 'I want to go, but I am tired.'", options: ["want","go","but","tired"], answer: "but", explanation: "'but' is a coordinating conjunction linking two independent clauses." },
  { q: "'Quickly' is an adverb modifying which word? 'She quickly finished the work.'", options: ["She","finished","quickly","work"], answer: "finished", explanation: "Adverbs like 'quickly' modify verbs — here it modifies 'finished'." },
  { q: "Choose the correct adjective: 'This is ___ interesting book.'", options: ["a","an","the","some"], answer: "an", explanation: "'an' is used before words starting with a vowel sound — 'interesting' starts with a vowel." },
  { q: "Identify the preposition: 'The cat jumped over the fence.'", options: ["cat","jumped","over","fence"], answer: "over", explanation: "'over' indicates the spatial relationship between the cat and the fence." },
  { q: "What is the noun in: 'Honesty is the best policy'?", options: ["Honesty","is","best","policy"], answer: "Honesty", explanation: "Both 'Honesty' and 'policy' are nouns. 'Honesty' is the subject, an abstract noun." },
  { q: "'Despite' in 'Despite the rain, we went out' is a:", options: ["Conjunction","Preposition","Adjective","Adverb"], answer: "Preposition", explanation: "'Despite' is a preposition meaning 'in spite of', followed by a noun phrase." },
  { q: "Which sentence has an adverb of frequency?", options: ["She is tall.","He runs fast.","They always arrive late.","We went home."], answer: "They always arrive late.", explanation: "'always' is an adverb of frequency, indicating how often something happens." },
  { q: "Identify the pronoun: 'Neither of them spoke.'", options: ["Neither","them","spoke","of"], answer: "them", explanation: "'them' is a personal pronoun referring to a group of people." },
  { q: "What part of speech is 'the' in English?", options: ["Noun","Adjective","Article (Determiner)","Pronoun"], answer: "Article (Determiner)", explanation: "'the' is a definite article, a type of determiner." },
  { q: "'Beautiful' is the ___ form of 'beauty'.", options: ["Noun","Verb","Adjective","Adverb"], answer: "Adjective", explanation: "'beautiful' describes a quality and modifies nouns, making it an adjective." },
  { q: "Choose the correct verb form: 'She ___ the guitar well.'", options: ["play","plays","playing","played"], answer: "plays", explanation: "Present simple third-person singular requires the -s suffix: 'plays'." },
  { q: "What type of noun is 'courage'?", options: ["Proper noun","Common noun","Collective noun","Abstract noun"], answer: "Abstract noun", explanation: "'courage' is an idea or quality that cannot be physically touched — an abstract noun." },
  { q: "Identify the conjunction type in: 'Although it was raining, they played.'", options: ["Coordinating","Subordinating","Correlative","Adverbial"], answer: "Subordinating", explanation: "'Although' introduces a subordinate clause, making it a subordinating conjunction." },
  { q: "The word 'very' in 'very hot' is a(n):", options: ["Adjective","Adverb","Intensifier","Noun"], answer: "Adverb", explanation: "'very' is an adverb modifying the adjective 'hot', often called an intensifier." },
];

const VOCABULARY_QUESTIONS: Question[] = [
  { q: "Synonym for 'Happy'", options: ["Sad","Joyful","Angry","Bored"], answer: "Joyful", explanation: "'Joyful' means feeling great happiness, synonymous with 'happy'." },
  { q: "Antonym for 'Expand'", options: ["Grow","Shrink","Widen","Stretch"], answer: "Shrink", explanation: "'Shrink' means to become smaller — the opposite of 'expand'." },
  { q: "Choose the word closest in meaning to 'Diligent':", options: ["Lazy","Careless","Hardworking","Reckless"], answer: "Hardworking", explanation: "'Diligent' describes someone who shows steady effort — synonymous with 'hardworking'." },
  { q: "'Eloquent' means:", options: ["Clumsy in speech","Fluent and persuasive","Silent","Confusing"], answer: "Fluent and persuasive", explanation: "An eloquent speaker expresses ideas clearly, fluently, and persuasively." },
  { q: "Antonym for 'Transparent':", options: ["Clear","Opaque","Visible","Bright"], answer: "Opaque", explanation: "'Opaque' means not transparent — you cannot see through it." },
  { q: "Which word means 'to make something worse'?", options: ["Alleviate","Ameliorate","Exacerbate","Mitigate"], answer: "Exacerbate", explanation: "'Exacerbate' means to make a bad situation worse." },
  { q: "Synonym for 'Brave':", options: ["Timid","Fearful","Courageous","Cautious"], answer: "Courageous", explanation: "'Courageous' means having or showing courage — synonymous with 'brave'." },
  { q: "'Verbose' describes someone who:", options: ["Speaks very little","Uses too many words","Is very quiet","Is very fast"], answer: "Uses too many words", explanation: "'Verbose' refers to using more words than necessary." },
  { q: "Antonym for 'Ancient':", options: ["Old","Historic","Modern","Traditional"], answer: "Modern", explanation: "'Modern' refers to the present or recent times — the opposite of 'ancient'." },
  { q: "The word 'Benevolent' means:", options: ["Cruel","Kind and generous","Selfish","Dishonest"], answer: "Kind and generous", explanation: "'Benevolent' describes someone who is well-meaning, kind, and charitable." },
  { q: "Which word is a synonym for 'Obscure'?", options: ["Clear","Famous","Unclear","Bright"], answer: "Unclear", explanation: "'Obscure' means not discovered or known about — hence unclear or unknown." },
  { q: "'Meticulous' means:", options: ["Careless","Very careful about detail","Reckless","Disorganised"], answer: "Very careful about detail", explanation: "'Meticulous' describes someone who pays great attention to detail." },
  { q: "Antonym for 'Generous':", options: ["Giving","Charitable","Stingy","Hospitable"], answer: "Stingy", explanation: "'Stingy' means unwilling to give or spend — the opposite of 'generous'." },
  { q: "Choose the correct word: 'The lecture was so ___ that many students fell asleep.'", options: ["Fascinating","Tedious","Engaging","Thrilling"], answer: "Tedious", explanation: "'Tedious' means long, slow, and boring — which caused students to sleep." },
  { q: "'Prudent' is closest in meaning to:", options: ["Reckless","Careless","Wise and careful","Impulsive"], answer: "Wise and careful", explanation: "'Prudent' describes showing care and thought for the future." },
  { q: "Antonym for 'Compulsory':", options: ["Mandatory","Required","Optional","Obligatory"], answer: "Optional", explanation: "'Optional' means available as a choice — the opposite of 'compulsory' (required)." },
  { q: "Synonym for 'Apprehensive':", options: ["Confident","Anxious","Calm","Relaxed"], answer: "Anxious", explanation: "'Apprehensive' means feeling worried or nervous about something — like 'anxious'." },
  { q: "'Acrimony' refers to:", options: ["Great joy","Bitterness and ill feeling","Strong friendship","Peacefulness"], answer: "Bitterness and ill feeling", explanation: "'Acrimony' describes bitterness or ill feeling, especially in speech or manner." },
  { q: "Which best replaces 'ubiquitous' in 'Smartphones are ubiquitous today'?", options: ["Rare","Everywhere","Expensive","New"], answer: "Everywhere", explanation: "'Ubiquitous' means present, appearing, or found everywhere." },
  { q: "Antonym for 'Eloquent':", options: ["Articulate","Fluent","Inarticulate","Persuasive"], answer: "Inarticulate", explanation: "'Inarticulate' means unable to express ideas clearly — opposite of 'eloquent'." },
];

const QUESTION_BANKS: Record<string, Question[]> = {
  Tenses: TENSE_QUESTIONS,
  "Parts of Speech": PARTS_OF_SPEECH_QUESTIONS,
  Vocabulary: VOCABULARY_QUESTIONS,
};

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const CATEGORIES = Object.keys(QUESTION_BANKS) as Array<keyof typeof QUESTION_BANKS>;
const QUESTIONS_PER_SESSION = 10;

export const Practice: React.FC = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load & shuffle a fresh set of 10 questions when category changes
  const generateTenseQuestions = async (): Promise<Question[] | null> => {
    try {
      const prompt = `Generate ${QUESTIONS_PER_SESSION} multiple-choice grammar questions covering different English tenses. Return a JSON array of objects each with keys: q, options (array of 4), answer (exact matching option), explanation. Keep options short and ensure only one correct answer. Example output: [{"q":"She ___ to school.","options":["go","goes","gone","going"],"answer":"goes","explanation":"..."}, ...]`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: 'You are a helpful English tutor that outputs valid JSON only.', prompt }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data.text || '';
      // Try to extract JSON from the response
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start === -1 || end === -1) return null;
      const jsonStr = text.slice(start, end + 1);
      const parsed = JSON.parse(jsonStr) as Question[];
      // Basic validation
      if (!Array.isArray(parsed) || parsed.length === 0) return null;
      return parsed.slice(0, QUESTIONS_PER_SESSION);
    } catch (err) {
      console.error('generateTenseQuestions error', err);
      return null;
    }
  };

  const startNewSession = async (cat: string = category) => {
    setCurrentQ(0);
    setScore(0);
    setSelected('');
    setShowFeedback(false);
    setSessionDone(false);
    setSaved(false);

    if (cat === 'Tenses') {
      const generated = await generateTenseQuestions();
      if (generated && generated.length > 0) {
        setQuestions(generated);
        return;
      }
    }

    const bank = QUESTION_BANKS[cat] ?? [];
    setQuestions(shuffle(bank).slice(0, QUESTIONS_PER_SESSION));
  };

  useEffect(() => {
    startNewSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    startNewSession(cat);
  };

  const q = questions[currentQ];

  const handleAnswer = (opt: string) => {
    if (showFeedback) return;
    setSelected(opt);
    setShowFeedback(true);
    if (opt === q.answer) setScore(s => s + 1);
  };

  const nextQuestion = async () => {
    if (currentQ + 1 < questions.length) {
      setCurrentQ(c => c + 1);
      setSelected('');
      setShowFeedback(false);
    } else {
      setSessionDone(true);
      await saveResults();
    }
  };

  const saveResults = async () => {
    if (saved) return;
    setSaved(true);
    const finalScore = score + (selected === q?.answer ? 1 : 0);
    await supabase.from('test_results').insert({
      user_id: user?.id,
      category,
      questions_answered: questions.length,
      correct_count: finalScore,
    });

    const effort = calculateTestEffort(questions.length);
    const logDate = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', user?.id)
      .eq('log_date', logDate)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('activity_logs')
        .update({ effort_percent: Math.min(100, (existing.effort_percent + effort) / 2) })
        .eq('id', existing.id);
    } else {
      await supabase.from('activity_logs').insert({
        user_id: user?.id,
        log_date: logDate,
        effort_percent: effort,
        module: 'Practice',
      });
    }
  };

  if (!questions.length) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (sessionDone) {
    const finalScore = score;
    const pct = Math.round((finalScore / questions.length) * 100);
    return (
      <div className="flex justify-center mt-10">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl">
              {pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'} Session Complete!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary mb-2">{finalScore}/{questions.length}</p>
            <p className="text-gray-600 mb-6">({pct}% correct in {category})</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => startNewSession()}>New Set</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-dark">Grammar &amp; Vocabulary</h2>
        <span className="text-sm font-medium text-gray-500">
          {currentQ + 1} / {questions.length} &nbsp;·&nbsp; Score: <span className="text-primary font-bold">{score}</span>
        </span>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              category === cat
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-secondary hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${((currentQ) / questions.length) * 100}%` }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{q.q}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.options.map(opt => {
            let cls = 'bg-white hover:border-primary cursor-pointer';
            if (showFeedback) {
              if (opt === q.answer) cls = 'bg-green-50 border-green-500';
              else if (opt === selected) cls = 'bg-red-50 border-red-400';
              else cls = 'bg-gray-50 opacity-50 border-gray-200 cursor-not-allowed';
            }
            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={showFeedback}
                className={`w-full text-left p-4 border-2 border-secondary rounded-xl transition-all duration-150 font-medium ${cls}`}
              >
                <span className="flex items-center gap-3">
                  {showFeedback && opt === q.answer && <CheckCircle size={18} className="text-green-600 flex-shrink-0" />}
                  {showFeedback && opt === selected && opt !== q.answer && <XCircle size={18} className="text-red-500 flex-shrink-0" />}
                  {opt}
                </span>
              </button>
            );
          })}

          {showFeedback && (
            <div className={`mt-4 p-4 rounded-xl border-l-4 ${selected === q.answer ? 'bg-green-50 border-green-500' : 'bg-orange-50 border-orange-400'}`}>
              <p className="font-bold mb-1">
                {selected === q.answer ? '✅ Correct!' : `❌ Incorrect — correct answer: "${q.answer}"`}
              </p>
              <p className="text-gray-700 text-sm">{q.explanation}</p>
            </div>
          )}
        </CardContent>

        {showFeedback && (
          <CardFooter className="justify-end">
            <Button onClick={nextQuestion}>
              {currentQ + 1 < questions.length ? 'Next Question →' : 'See Results'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
