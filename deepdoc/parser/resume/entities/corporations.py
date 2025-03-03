#
#  Copyright 2025 The InfiniFlow Authors. All Rights Reserved.
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.
#

import logging
import re
import json
import os
import pandas as pd
from rag.nlp import rag_tokenizer
from . import regions

import nltk
nltk.download('punkt_tab')
nltk.download('wordnet')

nltk_data_path = "/usr/local/share/nltk_data"
nltk.data.path.append(nltk_data_path)

# List of NLTK datasets to check and download if missing
nltk_data_packages = [
    "punkt",  # Correct dataset name (instead of 'punkt_tab')
    "wordnet"
]

for package in nltk_data_packages:
    package_path = os.path.join(nltk_data_path, "tokenizers" if package == "punkt" else "corpora", package)

    if not os.path.exists(package_path):
        print(f"{package} not found. Downloading...")
        nltk.download(package, download_dir=nltk_data_path)
    else:
        print(f"{package} already exists. Skipping download.")

current_file_path = os.path.dirname(os.path.abspath(__file__))
GOODS = pd.read_csv(
    os.path.join(current_file_path, "res/corp_baike_len.csv"), sep="\t", header=0, encoding="utf-8"
).fillna(0)
#GOODS["cid"] = GOODS["cid"].astype(str)

# Ensure 'cid' column exists before modifying it
if "cid" in GOODS.columns:
    GOODS["cid"] = GOODS["cid"].astype(str)
    GOODS = GOODS.set_index(["cid"])
else:
    raise KeyError('Column "cid" not found in CSV file.')

# Define JSON file paths
json_paths = {
    "CORP_TKS": os.path.join(current_file_path, "res/corp.tks.freq.json"),
    "GOOD_CORP": os.path.join(current_file_path, "res/good_corp.json"),
    "CORP_TAG": os.path.join(current_file_path, "res/corp_tag.json"),
}
# Load JSON files with UTF-8 encoding
json_data = {}
for key, path in json_paths.items():
    if not os.path.exists(path):
        raise FileNotFoundError(f"JSON file not found: {path}")

    with open(path, "r", encoding="utf-8") as f:
        json_data[key] = json.load(f)

# Assign loaded JSON data to variables
CORP_TKS = json_data["CORP_TKS"]
GOOD_CORP = json_data["GOOD_CORP"]
CORP_TAG = json_data["CORP_TAG"]


def baike(cid, default_v=0):
    global GOODS
    try:
        return GOODS.loc[str(cid), "len"]
    except Exception:
        pass
    return default_v


def corpNorm(nm, add_region=True):
    global CORP_TKS
    if not nm or not isinstance(nm, str):
        return ""
    nm = rag_tokenizer.tradi2simp(rag_tokenizer.strQ2B(nm)).lower()
    nm = re.sub(r"&amp;", "&", nm)
    nm = re.sub(r"[\(\)（）\+'\"\t \*\\【】-]+", " ", nm)
    nm = re.sub(
        r"([—-]+.*| +co\..*|corp\..*| +inc\..*| +ltd.*)", "", nm, 10000, re.IGNORECASE
    )
    nm = re.sub(
        r"(计算机|技术|(技术|科技|网络)*有限公司|公司|有限|研发中心|中国|总部)$",
        "",
        nm,
        10000,
        re.IGNORECASE,
    )
    if not nm or (len(nm) < 5 and not regions.isName(nm[0:2])):
        return nm

    tks = rag_tokenizer.tokenize(nm).split()
    reg = [t for i, t in enumerate(tks) if regions.isName(t) and (t != "中国" or i > 0)]
    nm = ""
    for t in tks:
        if regions.isName(t) or t in CORP_TKS:
            continue
        if re.match(r"[0-9a-zA-Z\\,.]+", t) and re.match(r".*[0-9a-zA-Z\,.]+$", nm):
            nm += " "
        nm += t

    r = re.search(r"^([^a-z0-9 \(\)&]{2,})[a-z ]{4,}$", nm.strip())
    if r:
        nm = r.group(1)
    r = re.search(r"^([a-z ]{3,})[^a-z0-9 \(\)&]{2,}$", nm.strip())
    if r:
        nm = r.group(1)
    return nm.strip() + (("" if not reg else "(%s)" % reg[0]) if add_region else "")


def rmNoise(n):
    n = re.sub(r"[\(（][^()（）]+[)）]", "", n)
    n = re.sub(r"[,. &（）()]+", "", n)
    return n


GOOD_CORP = set([corpNorm(rmNoise(c), False) for c in GOOD_CORP])
for c, v in CORP_TAG.items():
    cc = corpNorm(rmNoise(c), False)
    if not cc:
        logging.debug(c)
CORP_TAG = {corpNorm(rmNoise(c), False): v for c, v in CORP_TAG.items()}


def is_good(nm):
    global GOOD_CORP
    if nm.find("外派") >= 0:
        return False
    nm = rmNoise(nm)
    nm = corpNorm(nm, False)
    for n in GOOD_CORP:
        if re.match(r"[0-9a-zA-Z]+$", n):
            if n == nm:
                return True
        elif nm.find(n) >= 0:
            return True
    return False


def corp_tag(nm):
    global CORP_TAG
    nm = rmNoise(nm)
    nm = corpNorm(nm, False)
    for n in CORP_TAG.keys():
        if re.match(r"[0-9a-zA-Z., ]+$", n):
            if n == nm:
                return CORP_TAG[n]
        elif nm.find(n) >= 0:
            if len(n) < 3 and len(nm) / len(n) >= 2:
                continue
            return CORP_TAG[n]
    return []
