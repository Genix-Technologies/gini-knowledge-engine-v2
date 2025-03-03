import { useInfiniteFetchKnowledgeList } from '@/hooks/knowledge-hooks';
import { useFetchUserInfo } from '@/hooks/user-setting-hooks';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import {
  Button,
  Divider,
  Empty,
  Flex,
  Input,
  Skeleton,
  Space,
  Spin,
} from 'antd';
import { useTranslation } from 'react-i18next';
import InfiniteScroll from 'react-infinite-scroll-component';

import { useMemo } from 'react';
import styles from './index.less';


import {
  AddModelCard,
  ModelLibraryCard,
  SystemModelSetting,
} from './model/model-card';

const addedModelList = new Array(4).fill(1);

const modelLibraryList = new Array(4).fill(1);


export default function modelconfig() {
  return  <Flex className={styles.knowledge} vertical flex={1} id="scrollableDiv">
  <Spin spinning={false}>
  </Spin>
  <section className="p-8 space-y-8 ">
      
     
       {/* <SystemModelSetting></SystemModelSetting>
        <section className="mt-6">
          <h2 className="text-2xl font-semibold mb-3">Available models</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
            {addedModelList.map((x, idx) => (
              <AddModelCard key={idx}></AddModelCard>
            ))}
          </div>
        </section>*/} 
        <div className="flex justify-between items-center ">
        <h1 className="text-4xl font-bold"> Model Configuration</h1>
       {/* <Button>Unfinished</Button>*/} 
      </div>
        <section className="mt-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-2xl font-semibold "></h2>
          </div>
          <div className=" 2xl:grid-cols-8 gap-4">
            <div className="max-h-[84vh] overflow-auto">
              <SystemModelSetting/>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
            {modelLibraryList.map((x, idx) => (
              <ModelLibraryCard key={idx}></ModelLibraryCard>
            ))}
          </div>
          
        </section>
     
    </section>
</Flex>
}
