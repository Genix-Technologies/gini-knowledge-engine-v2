import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingOutlined } from '@ant-design/icons';
import { Key, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { PropsWithChildren, useCallback, useMemo } from 'react';
import ApiKeyModal from '../mconfig-setting/setting-model/api-key-modal';
import { useSelectLlmList } from '@/hooks/llm-hooks';
import { useSubmitApiKey, useSubmitAzure, useSubmitGoogle, useSubmitOllama, useSubmitSystemModelSetting } from '../mconfig-setting/setting-model/hooks';
import { useTranslate } from '@/hooks/common-hooks';
import { useTheme } from '@/components/theme-provider';
import { isLocalLlmFactory } from '../mconfig-setting/utils';
import AzureOpenAIModal from '../mconfig-setting/setting-model/azure-openai-modal';
import GoogleModal from '../mconfig-setting/setting-model/google-modal';
import OllamaModal from '../mconfig-setting/setting-model/ollama-modal';
import SystemModelSettingModal from '../mconfig-setting/setting-model/system-model-setting-modal';

const settings = [
  {
    title: 'GPT Model',
    description:
      'The default chat LLM all the newly created knowledgebase will use.',
    model: 'DeepseekChat',
  },
  {
    title: 'Embedding Model',
    description:
      'The default embedding model all the newly created knowledgebase will use.',
    model: 'DeepseekChat',
  },
  {
    title: 'Image Model',
    description:
      'The default multi-capable model all the newly created knowledgebase will use. It can generate a picture or video.',
    model: 'DeepseekChat',
  },
  {
    title: 'Speech2TXT Model',
    description:
      'The default ASR model all the newly created knowledgebase will use. Use this model to translate voices to text something text.',
    model: 'DeepseekChat',
  },
  {
    title: 'TTS Model',
    description:
      'The default text to speech model all the newly created knowledgebase will use.',
    model: 'DeepseekChat',
  },
];



const modelSettings = [
  {
    title: 'Open AI',
    description: '',
    isNew: false,
    model: 'OpenAI',
  },
  {
    title: 'Gemini',
    description: '',
    isNew: false,
    model: 'Gemini',
  },
  {
    title: 'Ollama',
    description: '',
    isNew: true,
    model: 'Ollama',
  },
  {
    title: 'Azure OpenAI',
    description: '',
    isNew: true,
    model: 'Azure-OpenAI',
  }
];

function Title({ children }: PropsWithChildren) {
  return <span className="font-bold text-xl">{children}</span>;
}

export function SystemModelSetting() {
  const { factoryList, myLlmList: llmList, loading } = useSelectLlmList();
  const { theme } = useTheme();

    //new 
    const {
        saveApiKeyLoading,
        initialApiKey,
        llmFactory,
        onApiKeySavingOk,
        apiKeyVisible,
        hideApiKeyModal,
        showApiKeyModal,
      } = useSubmitApiKey();
      const {
        saveSystemModelSettingLoading,
        onSystemSettingSavingOk,
        systemSettingVisible,
        hideSystemSettingModal,
        showSystemSettingModal,
      } = useSubmitSystemModelSetting();
      const {
        llmAddingVisible,
        hideLlmAddingModal,
        showLlmAddingModal,
        onLlmAddingOk,
        llmAddingLoading,
        selectedLlmFactory,
      } = useSubmitOllama();
    
      const {
        GoogleAddingVisible,
        hideGoogleAddingModal,
        showGoogleAddingModal,
        onGoogleAddingOk,
        GoogleAddingLoading,
      } = useSubmitGoogle();
    
    
      const {
        AzureAddingVisible,
        hideAzureAddingModal,
        showAzureAddingModal,
        onAzureAddingOk,
        AzureAddingLoading,
      } = useSubmitAzure();
    
      const ModalMap = useMemo(
        () => ({
          'Google Cloud': showGoogleAddingModal,
          'Azure-OpenAI': showAzureAddingModal,
        }),
        [
          showGoogleAddingModal,
          showAzureAddingModal,
        ],
      );

    //EOF new 
    //alert(JSON.stringify(llmFactory));
      const handleAddModel = useCallback(
        (llmFactory: string) => {
        //  showApiKeyModal({ llm_factory: llmFactory });
          if (isLocalLlmFactory(llmFactory)) {
            showLlmAddingModal(llmFactory);
          } else if (llmFactory in ModalMap) {
            ModalMap[llmFactory as keyof typeof ModalMap]();
          } else {
            showApiKeyModal({ llm_factory: llmFactory });
          }
        },
        [showApiKeyModal, showLlmAddingModal,ModalMap],
      );
  
  const { t } = useTranslate('setting');

  return (<>
    <Card>
      <CardContent className="p-4 space-y-6">
        {settings.map((x, idx) => (
          <div key={idx} className="flex items-center">
            <div className="flex-1 flex flex-col">
              <span className="font-semibold text-base">{x.title}</span>
              <span className="text-colors-text-neutral-standard">
                {x.description}
              </span>
            </div>
            <div className="ml-2 flex-1">
              <Select defaultValue="english">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">select</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
   
    <section className="mt-6">
      <h2 className="text-2xl font-semibold mb-3">Added model</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
          {modelSettings.map((x, idx) => (
            <Card className="pt-4">
            <CardContent className="space-y-4">
              <div className="flex justify-between space-y-4">
              </div>
              <Title>{x.title}</Title>
              <p></p>
              {/*<Card>
                <CardContent className="p-3 flex gap-2">
                  <Button variant={'secondary'}>
                    deepseek-chat <Trash2 />
                  </Button>
                  <Button variant={'secondary'}>
                    deepseek-code <Trash2 />
                  </Button>
                </CardContent>
              </Card>*/}
              <div className="flex justify-end gap-2">
                {/*<Button variant="secondary" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>*/}
                <Button variant={'tertiary'} 
                  onClick={() => handleAddModel(x.model)}
                 > 
                <SettingOutlined /> API
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
      }
      </div>
      <ApiKeyModal
        visible={apiKeyVisible}
        hideModal={hideApiKeyModal}
        loading={saveApiKeyLoading}
        initialValue={initialApiKey}
        onOk={onApiKeySavingOk}
        llmFactory={llmFactory}
      ></ApiKeyModal>
      {systemSettingVisible && (
        <SystemModelSettingModal
          visible={systemSettingVisible}
          onOk={onSystemSettingSavingOk}
          hideModal={hideSystemSettingModal}
          loading={saveSystemModelSettingLoading}
        ></SystemModelSettingModal>
      )}
      <OllamaModal
        visible={llmAddingVisible}
        hideModal={hideLlmAddingModal}
        onOk={onLlmAddingOk}
        loading={llmAddingLoading}
        llmFactory={selectedLlmFactory}
      ></OllamaModal>
      <GoogleModal
        visible={GoogleAddingVisible}
        hideModal={hideGoogleAddingModal}
        onOk={onGoogleAddingOk}
        loading={GoogleAddingLoading}
        llmFactory={'Google Cloud'}
      ></GoogleModal>
      <AzureOpenAIModal
        visible={AzureAddingVisible}
        hideModal={hideAzureAddingModal}
        onOk={onAzureAddingOk}
        loading={AzureAddingLoading}
        llmFactory={'Azure-OpenAI'}
      ></AzureOpenAIModal>
    </section>
  
    </>
  );
}

export function ModelConfigCard(model: any) {
  return (
    <Card className="pt-4">
    <CardContent className="space-y-4">
      {JSON.stringify(model)}
      <Title>{model.title}</Title>
      <p>{model.model}</p>
      <p>{model.description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
        <Button variant={'tertiary'}>
          <Key /> API
        </Button>
      </div>
    </CardContent>
  </Card>
  );
}
export function ModelLibraryCard(){
  return <></>
}