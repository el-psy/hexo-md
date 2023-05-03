---
title: Bert个人总结
date: 2023-05-03 14:32:01
categoires:
	- 深度学习
	- NLP
	- bert
tags:
	- 深度学习
	- NLP
	- bert
---

# 简介

bert大名不必多提。作为动态词嵌入最有名的模型，解析的博客数不胜数。什么transformer之类的本文一概不提。 
本文简单叙述一下bert代码。 
然后有精力的话，再用其他几篇文章总结一下bert出现之后的其他改进模型。 

# 代码总览

代码位于[bert](https://github.com/google-research/bert) 

```
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----         2023/4/29     18:28           1477 .gitignore
-a----         2023/4/29     18:28           1354 CONTRIBUTING.md
-a----         2023/4/29     18:28          11560 LICENSE
-a----         2023/4/29     18:28          51636 README.md
-a----         2023/4/29     18:28            631 __init__.py
-a----         2023/4/29     18:28          16944 create_pretraining_data.py
-a----         2023/4/29     18:28          14317 extract_features.py
-a----         2023/4/29     18:28          38908 modeling.py
-a----         2023/4/29     18:28           9468 modeling_test.py
-a----         2023/4/29     18:28          11545 multilingual.md
-a----         2023/4/29     18:28           6432 optimization.py
-a----         2023/4/29     18:28           1769 optimization_test.py
-a----         2023/4/29     18:28          67718 predicting_movie_reviews_with_bert_on_tf_hub.ipynb
-a----         2023/4/29     18:28            112 requirements.txt
-a----         2023/4/29     18:28          35764 run_classifier.py
-a----         2023/4/29     18:28          11740 run_classifier_with_tfhub.py
-a----         2023/4/29     18:28          19160 run_pretraining.py
-a----         2023/4/29     18:28          47815 run_squad.py
-a----         2023/4/29     18:28           4427 sample_text.txt
-a----         2023/4/29     18:28          12656 tokenization.py
-a----         2023/4/29     18:28           4726 tokenization_test.py
```

其中`create_pretraining_data.py`用于处理数据，`modeling.py`是模型及其配置对象所在，`run_pretraining.py`是bert模型训练所用。

# 数据处理

## 启动

代码的`README.md`叙述了代码处理命令。 
其中使用了`tensorflow`的flags处理了命令行指令的参数。 
使用`tf.app.run()`启动了`main`函数。

## main函数

1. 使用tf.logging设置了日志级别
2. 创建tokenizer。熟悉huggingface的人应该不陌生。
3. 读取命令行指令参数中的输入文件名，放到`input_files`数组里。并在日志输出
4. 使用`create_training_instances`函数创建`instances`数组
5. 使用`write_instance_to_example_files`函数将`instances`数组存放到指令中的输入文件参数里。

## create_training_instances函数

1. 随机打乱document
2. 控制每条数据长度。以0.5的概率随机插入，如果是随机`is_random_next`值为True，否则为False
2. token中使用`[CLS]`和`[SEP]`分隔符
3. 使用`TrainingInstance`创建`instance`并保存在`instances`数组里。

```python
instance = TrainingInstance(
    tokens=tokens, # token分词结果列表，其中已经包含mask了
    segment_ids=segment_ids, # 对应token的列表，由0， 1组成，代表前后两个分句
    is_random_next=is_random_next, # 与segment_ids对应。如果两个分句在原文中是连续的为False；如果是随机链接（概率0.5）的话为True
    masked_lm_positions=masked_lm_positions, # mask词对应的index
    masked_lm_labels=masked_lm_labels) # 与之对应的mask词的token
```

## write_instance_to_example_files函数

主要就是将下面这些写入文件中

```python
    features = collections.OrderedDict()
    features["input_ids"] = create_int_feature(input_ids)
    features["input_mask"] = create_int_feature(input_mask)
    features["segment_ids"] = create_int_feature(segment_ids)
    features["masked_lm_positions"] = create_int_feature(masked_lm_positions)
    features["masked_lm_ids"] = create_int_feature(masked_lm_ids)
    features["masked_lm_weights"] = create_float_feature(masked_lm_weights)
    features["next_sentence_labels"] = create_int_feature([next_sentence_label])  # 上面的is_random_next
```

# 预训练

## 总览

代码的`README.md`叙述了代码处理命令。 
其中使用了`tensorflow`的flags处理了命令行指令的参数。 
使用`tf.app.run()`启动了`main`函数。

## main函数

1. 修改tf的logging等级
2. 检验命令行参数中的train和eval，要么是评估模型，要么是训练模型
3. 生成bert的config
4. 读取输入文件名
5. tpu相关，不明
6. 以`model_fn_builder`函数生成`model_fn`
7. 训练或者评估，然后日志

## model_fn_builder函数

1. 读取输入数据
2. 使用模型
3. 计算loss

从loss入手
```python
(masked_lm_loss,
 masked_lm_example_loss, masked_lm_log_probs) = get_masked_lm_output(
     bert_config, model.get_sequence_output(), model.get_embedding_table(),
     masked_lm_positions, masked_lm_ids, masked_lm_weights)

(next_sentence_loss, next_sentence_example_loss,
 next_sentence_log_probs) = get_next_sentence_output(
     bert_config, model.get_pooled_output(), next_sentence_labels)

total_loss = masked_lm_loss + next_sentence_loss
```

明显看出来bert预训练的两大任务，mask词预测和下一句预测。
从`modeling.py`中分析可知，
```python
model.get_sequence_output() # 获取bert中的encoder输出，也就是transformer的输出
model.get_embedding_table() # 获取bert第一步的输出
```
这里简单提一下bert的模型。 
第一步是根据词的id（一个int）在embdding层找到对应的向量，多个词组成一句话形成一个矩阵。 
第二步是将这个矩阵输入到一组transformer模型中，得到bert输出的词向量
第三步时其他层，稍后再讲。

这里mask词预测任务用到了bert输出的词向量，和embedding层输出，没记错两者长度都是`bert_config.hidden_size`
具体上，先将词向量进行线性变换，然后与embedding层输出相乘，然后进行`log_softmax`，与mask位置进行比较（mask的one_hot），得到loss。

前后句预测任务。
输入时的`segment_id`（前句为0，后句为1）分割了前后句。
首先`modeling.py`第三步有一个`pooler`，将词向量输出的第一个词的向量进行线性变换并输出，得到`pooled_output`
```python
with tf.variable_scope("pooler"):
    # We "pool" the model by simply taking the hidden state corresponding
    # to the first token. We assume that this has been pre-trained
    first_token_tensor = tf.squeeze(self.sequence_output[:, 0:1, :], axis=1)
    self.pooled_output = tf.layers.dense(
        first_token_tensor,
        config.hidden_size,
        activation=tf.tanh,
        kernel_initializer=create_initializer(config.initializer_range))
```
计算loss时将其进行线性变换为长度为2的向量。
需要预测的值是数据预处理是的`is_random_next`。
交叉熵loss。

# 最后

想必这篇文章与之前读过的bert博客不同。
这也是我的初衷。
要写点别人没有的。
想必读完这篇之后会对bert源码有初步的了解。
对于bert模型如何训练会有更深的了解。
知道两大任务到底如何实现的。
之后我还会随便总结一下其他bert改进模型，不过那就是没什么营养人云亦云了。
反正我也不想在此领域深究。
饶过我的2GB显存的小笔记本吧。