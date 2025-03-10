import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ModelConfigCard,
} from './model-card';

//	Gemini	1736526838254	2025-01-10 16:33:58	1736526838254	2025-01-10 16:33:58		LLM,TEXT EMBEDDING,IMAGE2TEXT	1	
//	OpenAI	1736526837474	2025-01-10 16:33:57	1736526837474	2025-01-10 16:33:57		LLM,TEXT EMBEDDING,TTS,TEXT RE-RANK,SPEECH2TEXT,MODERATION	1	

const modelLibraryList = [
  {
    name: 'OpenAI',
    ogo:'',
    tags: 'TEXT EMBEDDING, TEXT RE-RANK',
    api_key: 'OpenAI',
    api_url: 'OpenAI',
  },
  {
    name: 'Gemini',
    logo:'',
    tags: 'LLM,TEXT EMBEDDING,SPEECH2TEXT,MODERATION',
    api_key: 'OpenAI',
    api_url: 'OpenAI',
  },
  {
    name: 'LLama',
    logo:'',
    tags: 'LLM,IMAGE2TEXT',
    api_key: 'OpenAI',
    api_url: 'OpenAI',
  },
];


export default function ModelManagement() {
  return (
    <section className="p-8 space-y-8 ">
      <div className="flex justify-between items-center ">
        <h1 className="text-4xl font-bold">Team management</h1>
        <Button>Unfinished</Button>
      </div>
      <div className="max-h-[84vh] overflow-auto">
        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">Addeds models</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
          </div>
        </section>
        <section className="mt-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold ">Model library</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {modelLibraryList.map((model, idx) => (
              <ModelConfigCard key={idx} model={model}></ModelConfigCard>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
