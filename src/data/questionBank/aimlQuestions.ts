import { QuestionItem } from '../../types';

export const AIML_QUESTIONS: QuestionItem[] = [
  {
    id: 'ai-1',
    slug: 'transformer-attention-and-flashattention',
    title: 'Deconstruct the multi-head self-attention mechanism in modern Transformer architectures and explain the memory-bound IO-awareness of FlashAttention.',
    questionText: 'How is scaled dot-product attention computed mathematically? Why is attention memory-bound rather than compute-bound on modern GPUs, and how does FlashAttention tile SRAM to achieve 2-4x speedups without approximations?',
    category: 'AI Engineering & MLOps',
    categoryId: 'ai-mlops',
    topicId: 'rag-architecture',
    subtopicId: 'rag-architecture',
    difficulty: 'Hard',
    questionType: 'Conceptual',
    roleTarget: 'Machine Learning Engineer',
    roleIds: ['ml-engineer', 'ai-engineer', 'genai-engineer'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Deconstruct Query, Key, Value tensor projections, quadratic sequence length O(N^2) memory complexity, high-bandwidth memory (HBM) vs on-chip SRAM, and FlashAttention tiling.',
    shortAnswer: 'Scaled Dot-Product Attention is computed as softmax((Q * K^T) / sqrt(d_k)) * V. For a sequence length N, standard attention materializes an N x N intermediate attention matrix in GPU High-Bandwidth Memory (HBM), incurring quadratic O(N^2) memory reads and writes. FlashAttention makes attention IO-aware: it fuses the softmax reduction and multiplication into a single GPU kernel, tiling inputs into fast on-chip SRAM (20TB/s) using online softmax normalization, never writing the N x N matrix back to slow HBM.',
    detailedAnswer: '1. **Standard Attention Mathematical Computation**:\n   Given input embeddings `X`, linear projection matrices `W_Q`, `W_K`, `W_V` produce Query `Q`, Key `K`, and Value `V` tensors.\n   - Matrix Multiplication: `S = Q * K^T` (shape N x N, where N is sequence length).\n   - Scaling: `S_scaled = S / sqrt(d_k)` to prevent vanishing gradients during softmax when dimension `d_k` is large.\n   - Softmax: `P = softmax(S_scaled)` (normalized probability weights across tokens).\n   - Context Output: `O = P * V`.\n\n2. **The GPU Memory Hierarchy Bottleneck**:\n   Modern GPUs (A100/H100) have two primary memory tiers:\n   - *High-Bandwidth Memory (HBM)*: Large capacity (40GB-80GB), but slow bandwidth (~1.5-3 TB/sec).\n   - *On-chip SRAM*: Extremely fast (~20 TB/sec), but tiny capacity (~20MB-50MB per GPU SM).\n   In standard PyTorch attention, `S` and `P` must be written to HBM and read back multiple times. The GPU spend 80% of its clock cycles waiting on memory bus transfer rather than executing floating-point tensor operations (memory-bound).\n\n3. **FlashAttention Innovation (Tiling & Online Softmax)**:\n   - *Tiling*: FlashAttention divides `Q`, `K`, and `V` into blocks that fit entirely in fast on-chip SRAM.\n   - *Online Softmax*: Softmax requires the global maximum `max(x_i)` to compute `exp(x_i - max)`. FlashAttention uses the online softmax algorithm (Milakov & Gimelshein) to incrementally compute scaling factors block by block, updating running sums and normalization factors.\n   - *Recomputation in Backward Pass*: Rather than storing the N x N attention matrix for backpropagation, FlashAttention recomputes it on-chip during the backward pass from the saved output and block statistics, using 10x less GPU memory.',
    codeExample: {
      language: 'python',
      code: `import torch
import torch.nn.functional as F

# 1. Standard Scaled Dot-Product Attention (PyTorch Conceptual)
def standard_attention(Q, K, V):
    d_k = Q.size(-1)
    # Generates massive [batch, heads, N, N] tensor in slow GPU HBM!
    scores = torch.matmul(Q, K.transpose(-2, -1)) / (d_k ** 0.5)
    attn_weights = F.softmax(scores, dim=-1)
    return torch.matmul(attn_weights, V)

# 2. FlashAttention-2 via PyTorch 2.0+ Scaled Dot Product Attention (Fused Kernel)
def fused_flash_attention(Q, K, V):
    # Executes fused CUDA kernel: tiles blocks in SRAM, never materializes N x N in HBM
    with torch.backends.cuda.sdp_kernel(enable_flash=True, enable_math=False):
        return F.scaled_dot_product_attention(Q, K, V, is_causal=True)`,
      explanation: 'PyTorch scaled_dot_product_attention invokes FlashAttention-2, reducing memory footprint from O(N^2) to O(N) and accelerating training.'
    },
    commonMistakes: [
      'Assuming FlashAttention is an approximation like Linformer or Performer; FlashAttention computes exact, mathematically identical attention with zero accuracy degradation.',
      'Forgetting that FlashAttention requires specific tensor alignments and GPU compute capabilities (Ampere/Hopper: A100, H100, RTX 3090+).',
      'Thinking GPU computation time is purely FLOP-bound without profiling memory bandwidth saturation.'
    ],
    realWorldUseCases: [
      'Training and serving modern LLMs (Llama 3, Mistral, GPT-4) with context lengths of 32k to 128k tokens.',
      'Long-context document summarization and code generation models.'
    ],
    tradeOffs: [
      'FlashAttention slightly increases total compute operations during backprop because it recomputes attention on the fly, but achieves 2-4x net training speedup because it eliminates HBM memory bottlenecks.'
    ],
    followUpQuestions: [
      'How does FlashAttention-2 improve over FlashAttention-1 by partitioning work across the sequence dimension instead of the batch/head dimensions?',
      'How does Grouped-Query Attention (GQA) reduce KV cache memory during inference while retaining multi-head representational capacity?'
    ],
    relatedQuestionIds: ['ai-2', 'ai-5', 'ai-6'],
    tags: ['Machine Learning', 'Transformers', 'FlashAttention', 'Deep Learning', 'PyTorch'],
    keywords: ['FlashAttention', 'Multi-Head Attention', 'Softmax', 'HBM', 'SRAM', 'Tiling', 'KV Cache'],
    companies: ['NVIDIA', 'OpenAI', 'Meta', 'Anthropic'],
    status: 'passed',
    statusLabel: 'Practiced 2x • High Score: 96%',
    isBookmarked: true
  },
  {
    id: 'ai-2',
    slug: 'hybrid-rag-dense-vs-sparse-reciprocal-rank-fusion',
    title: 'Explain the architectural trade-offs between dense semantic retrieval (bi-encoders) and sparse lexical retrieval (BM25) in production RAG systems.',
    questionText: 'When does dense vector search fail on exact domain keywords, and how does Reciprocal Rank Fusion (RRF) combine vector search with BM25?',
    category: 'AI Engineering & MLOps',
    categoryId: 'ai-mlops',
    topicId: 'rag-architecture',
    subtopicId: 'chunking-strategies',
    difficulty: 'Hard',
    questionType: 'Trade-off Analysis',
    roleTarget: 'Machine Learning Engineer',
    roleIds: ['ai-engineer', 'genai-engineer', 'ml-engineer'],
    estimatedTime: '4 mins response',
    estimatedMinutes: 4,
    description: 'Compare bi-encoder embeddings vs BM25 inverted indexes, out-of-vocabulary acronym failures, hybrid search pipelines, and cross-encoder re-ranking.',
    shortAnswer: 'Dense retrieval (bi-encoders like text-embedding-3 or BGE) maps text into continuous vector spaces to capture conceptual meaning and synonyms, but struggles with exact acronyms, serial numbers, and rare domain terms. Sparse retrieval (BM25) indexes inverted term frequencies, excelling at exact keyword matching but missing semantic synonyms. Production RAG uses Hybrid Search, combining dense and sparse result lists via Reciprocal Rank Fusion (RRF) and passing the top 20 candidates through a cross-encoder re-ranker.',
    detailedAnswer: '1. **Dense Semantic Retrieval (Bi-Encoders)**:\n   - Converts documents into 768- or 1536-dimensional vectors using models like `text-embedding-3-small`.\n   - *Strength*: Captures conceptual intent (e.g. "cardiac arrest" matches "heart attack" even with zero overlapping keywords).\n   - *Failure Mode*: Embedding models compress an entire passage into a single vector, causing "semantic dilution". Queries for specific part numbers (e.g. `XR-9021`), code symbols, or rare medical acronyms often return irrelevant results with high cosine similarity.\n\n2. **Sparse Lexical Retrieval (BM25)**:\n   - Builds an inverted index calculating Term Frequency-Inverse Document Frequency (TF-IDF) with document length normalization.\n   - *Strength*: Deterministic, lightning-fast, and exact on product codes, IDs, and domain-specific jargon.\n   - *Failure Mode*: Vocabulary mismatch problem (queries for "cheap hotels" will not match documents saying "budget accommodations").\n\n3. **Hybrid Search with Reciprocal Rank Fusion (RRF)**:\n   RRF merges ranked lists from different search engines without needing to calibrate raw score ranges: \n   `RRF_Score(d) = sum_{m in models} 1 / (k + rank_m(d))` (where constant `k` is typically 60).\n\n4. **Cross-Encoder Re-Ranking**:\n   Bi-encoders score query and document independently (`cos(q, d)`). A Cross-Encoder passes the concatenated `[Query, Document]` through full self-attention layers simultaneously, capturing deep token-to-token interactions to produce an ultra-precise final top-5 ranking for the LLM context window.',
    codeExample: {
      language: 'python',
      code: `from collections import defaultdict

def reciprocal_rank_fusion(dense_ranks, sparse_ranks, k=60):
    """
    Combines dense vector ranks and BM25 sparse ranks into a single unified score.
    dense_ranks: list of doc_ids sorted by vector similarity
    sparse_ranks: list of doc_ids sorted by BM25 score
    """
    rrf_scores = defaultdict(float)

    for rank, doc_id in enumerate(dense_ranks, start=1):
        rrf_scores[doc_id] += 1.0 / (k + rank)

    for rank, doc_id in enumerate(sparse_ranks, start=1):
        rrf_scores[doc_id] += 1.0 / (k + rank)

    # Sort descending by fused RRF score
    return sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)`,
      explanation: 'RRF normalizes ranks across vector and keyword engines, preventing one search engine score scale from skewing results.'
    },
    commonMistakes: [
      'Relying solely on vector search for technical documentation containing code symbols, function names, and error codes.',
      'Attempting to linearly combine raw vector cosine distance and BM25 scores without rank normalization (they occupy completely incompatible mathematical distributions).',
      'Passing 50 raw retrieved chunks directly into an LLM prompt, triggering the "Lost in the Middle" attention degradation phenomenon.'
    ],
    realWorldUseCases: [
      'Enterprise internal search across Jira tickets, GitHub repos, and Confluence docs containing mixed natural language and ticket keys.',
      'Legal and financial RAG systems requiring verbatim clause citations.'
    ],
    tradeOffs: [
      'Hybrid search requires hosting both a vector database (Pinecone/Milvus) and an inverted text index (Elasticsearch/OpenSearch), increasing pipeline maintenance and infrastructure cost.'
    ],
    followUpQuestions: [
      'What is ColBERT (Late Interaction), and how does it bridge the gap between bi-encoders and cross-encoders in latency and accuracy?',
      'How does Contextual Chunking (adding document summary headers to chunks) improve embedding retrieval accuracy?'
    ],
    relatedQuestionIds: ['ai-1', 'ai-3', 'ai-5'],
    tags: ['RAG', 'Vector Search', 'BM25', 'Embeddings', 'AI Architecture'],
    keywords: ['RAG', 'Dense Retrieval', 'BM25', 'Reciprocal Rank Fusion', 'RRF', 'Cross-Encoder', 'Re-ranking'],
    companies: ['Cohere', 'Pinecone', 'Elastic', 'Google'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 93%',
    isBookmarked: true
  },
  {
    id: 'ai-3',
    slug: 'lora-qlora-parameter-efficient-fine-tuning',
    title: 'Compare LoRA (Low-Rank Adaptation) and QLoRA for LLM parameter-efficient fine-tuning, explaining rank decomposition and NF4 quantization.',
    questionText: 'How does LoRA decompose weight updates W = W_0 + B * A? What is NormalFloat 4 (NF4) in QLoRA, and how does double quantization reduce GPU VRAM?',
    category: 'AI Engineering & MLOps',
    categoryId: 'ai-mlops',
    topicId: 'llm-fine-tuning',
    subtopicId: 'lora-mechanics',
    difficulty: 'Hard',
    questionType: 'Conceptual',
    roleTarget: 'Machine Learning Engineer',
    roleIds: ['ml-engineer', 'genai-engineer', 'ai-engineer'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Explain intrinsic low rank of weight matrices, adapters A and B initialization, alpha scaling factor, NF4 quantile quantization, and memory savings.',
    shortAnswer: 'Full fine-tuning updates all billions of LLM parameters, requiring massive GPU VRAM for optimizer states and gradients. LoRA (Low-Rank Adaptation) freezes pre-trained weights W_0 and models weight updates delta-W as the product of two low-rank matrices B (d x r) and A (r x k) where r << d (e.g. r=8), reducing trainable parameters by 99%. QLoRA compresses the frozen base model to 4-bit NormalFloat (NF4) and adds Double Quantization and Paged Optimizers, enabling fine-tuning a 70B model on a single 48GB GPU with zero performance degradation.',
    detailedAnswer: '1. **LoRA Low-Rank Decomposition**:\n   Research by Aghajanyan et al. proved that over-parametrized neural networks reside on a low "intrinsic dimension". During fine-tuning, the weight update matrix `delta_W` does not need full rank.\n   - Instead of updating `W_0 in R^{d x k}`, LoRA factors it into `delta_W = B * A`, where `A in R^{r x k}` is initialized from a Gaussian distribution, and `B in R^{d x r}` is initialized to zeros (so `delta_W = 0` at training step 0).\n   - Forward pass: `h = W_0 * x + (alpha / r) * (B * A * x)`.\n   - During inference, `delta_W` can be permanently merged back into `W_0` with zero added inference latency.\n\n2. **QLoRA Innovations (Dettmers et al.)**:\n   - *NormalFloat 4 (NF4)*: Standard int4 quantization assumes uniform distribution. Neural network weights follow a normal Gaussian distribution `N(0, sigma^2)`. NF4 builds 16 discrete quantile bins with equal information density, minimizing quantization error.\n   - *Double Quantization*: Quantization scales themselves take 32 bits per 64-block. Double quantization quantizes the quantization constants into 8-bit floats, saving ~0.37 bits per parameter (~3GB on a 65B model).\n   - *Paged Optimizers*: Uses CUDA Unified Memory to automatically page optimizer states to CPU RAM during activation memory spikes, preventing OOM crashes.',
    codeExample: {
      language: 'python',
      code: `import torch
from peft import LoraConfig, get_peft_model
from transformers import AutoModelForCausalLM, BitsAndBytesConfig

# 1. 4-bit NF4 Quantization Configuration (QLoRA)
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True
)

base_model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3-8B",
    quantization_config=bnb_config,
    device_map="auto"
)

# 2. LoRA Low-Rank Adapter Configuration
lora_config = LoraConfig(
    r=16, # Rank dimension (r << 4096)
    lora_alpha=32, # Scaling factor (typically 2 * r)
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_dropout=0.05,
    bias="none",
    task_type="CAUSAL_LM"
)

# Wraps base model: Only 0.1% parameters are trainable!
peft_model = get_peft_model(base_model, lora_config)
peft_model.print_trainable_parameters()`,
      explanation: 'QLoRA loads the 8B model in 5.5GB of VRAM and trains only low-rank adapter matrices, drastically lowering training infrastructure costs.'
    },
    commonMistakes: [
      'Targeting only query and value matrices (`q_proj`, `v_proj`); research shows targeting all linear layers (including MLP feed-forward modules) yields superior accuracy.',
      'Setting rank `r` excessively high (e.g. `r=256`), which risks overfitting and defeats the parameter efficiency benefits.',
      'Deploying multiple separate merged checkpoints instead of keeping one frozen base model in VRAM and dynamically swapping lightweight LoRA adapter weights.'
    ],
    realWorldUseCases: [
      'Domain adaptation of foundational LLMs for legal contract analysis or medical diagnosis.',
      'Multi-tenant enterprise SaaS serving custom fine-tuned models for thousands of enterprise clients on a shared GPU cluster.'
    ],
    tradeOffs: [
      'LoRA adapter swapping during inference can cause slight throughput degradation if not using specialized multi-adapter serving engines (like S-LoRA/Punica).'
    ],
    followUpQuestions: [
      'How does Direct Preference Optimization (DPO) eliminate the need for a separate reward model in RLHF alignment?',
      'What are the trade-offs of LoRA rank r=8 vs r=64 on complex mathematical reasoning tasks?'
    ],
    relatedQuestionIds: ['ai-1', 'ai-4'],
    tags: ['Machine Learning', 'LoRA', 'QLoRA', 'Fine-Tuning', 'PEFT', 'LLMs'],
    keywords: ['LoRA', 'QLoRA', 'PEFT', 'NF4', 'rank decomposition', 'BitsAndBytes', 'quantization'],
    companies: ['Hugging Face', 'Meta', 'Mistral AI', 'Together AI'],
    status: 'unattempted',
    statusLabel: 'Not attempted yet',
    isBookmarked: false
  },
  {
    id: 'ai-4',
    slug: 'vllm-pagedattention-continuous-batching',
    title: 'Design a high-throughput, low-latency LLM inference engine supporting continuous dynamic batching, PagedAttention, and speculative decoding.',
    questionText: 'Why does static batching waste 60-80% of GPU compute in LLM serving? How does PagedAttention manage KV cache memory, and how does speculative decoding achieve 2-3x faster token generation?',
    category: 'AI Engineering & MLOps',
    categoryId: 'ai-mlops',
    topicId: 'llm-serving-inference',
    subtopicId: 'paged-attention',
    difficulty: 'Hard',
    questionType: 'System Design',
    roleTarget: 'Machine Learning Engineer',
    roleIds: ['mlops-engineer', 'ai-engineer', 'distributed-systems-eng'],
    estimatedTime: '5 mins response',
    estimatedMinutes: 5,
    description: 'Explain memory fragmentation in KV cache, virtual memory paging in PagedAttention, iteration-level continuous batching, and draft model speculative verification.',
    shortAnswer: 'Traditional LLM serving suffers from static batching inefficiency (shorter sequences wait for the longest sequence to finish) and KV cache memory fragmentation (allocating contiguous memory for worst-case context lengths wastes 60-80% of GPU VRAM). PagedAttention (vLLM) resolves memory fragmentation by storing KV cache in non-contiguous virtual memory blocks, enabling Continuous Dynamic Batching at the iteration level. Speculative decoding accelerates generation by having a small draft model generate tokens that a target model verifies in parallel.',
    detailedAnswer: '1. **The KV Cache Memory Crisis**:\n   During autoregressive generation, generating each token requires the Key and Value states of all previous tokens. For a 13B model with 2048 context length, a single request\'s KV cache consumes ~1.6GB of VRAM. Standard frameworks allocate contiguous memory blocks for the maximum possible sequence length, causing severe internal and external memory fragmentation that restricts batch size to 4-8 requests.\n\n2. **PagedAttention Architecture (vLLM)**:\n   Inspired by virtual memory paging in operating systems, PagedAttention partitions the KV cache into fixed-size blocks (e.g. 16 tokens). \n   - Blocks reside in non-contiguous physical GPU VRAM.\n   - A **Block Table** maps logical token sequences to physical memory blocks.\n   - Near-zero memory waste: VRAM waste is reduced to under 4% (only the final incomplete block), allowing 2x-4x larger batch sizes on the same GPU.\n\n3. **Continuous Dynamic Batching (Iteration-level)**:\n   Instead of batch-level scheduling, requests are scheduled at the token iteration level. When a short request emits `<|endoftext|>`, its memory is freed immediately, and a newly arrived request joins the running batch on the very next token generation step.\n\n4. **Speculative Decoding**:\n   Autoregressive generation is strictly sequential (1 forward pass per token). Speculative decoding uses an ultra-fast draft model (e.g. Llama-3-1B) to draft K candidate tokens sequentially in a few milliseconds. The large target model (Llama-3-70B) evaluates all K tokens in a single parallel forward pass, accepting valid tokens and rejecting mismatches, achieving 2x-3x speedup with zero loss in mathematical distribution.',
    codeExample: {
      language: 'python',
      code: `from vllm import LLM, SamplingParams

# High-Throughput vLLM Server Initialization with PagedAttention
llm = LLM(
    model="meta-llama/Meta-Llama-3-8B-Instruct",
    tensor_parallel_size=1, # Number of GPUs
    gpu_memory_utilization=0.90, # Uses PagedAttention to saturate 90% VRAM with zero fragmentation
    max_model_len=8192
)

# Continuous Dynamic Batching processes requests concurrently at the token level
prompts = [
    "Explain quantum superposition in 2 sentences.",
    "Write a quicksort implementation in Python with detailed comments."
]

sampling_params = SamplingParams(temperature=0.7, top_p=0.95, max_tokens=256)
outputs = llm.generate(prompts, sampling_params)

for output in outputs:
    print(output.outputs[0].text)`,
      explanation: 'vLLM manages KV caches via PagedAttention and continuously batches prompt arrivals and token completions without padding waste.'
    },
    commonMistakes: [
      'Using standard Hugging Face `generate()` in production web servers; it does not support continuous batching or PagedAttention, resulting in 10x lower throughput.',
      'Ignoring the tensor parallelism communication bottleneck when sharding models across multiple GPUs over standard PCIe vs NVLink.',
      'Setting GPU memory utilization too high without reserving buffer space for dynamic activation spikes, triggering unexpected CUDA OOM errors.'
    ],
    realWorldUseCases: [
      'Cloud inference providers (Together AI, Anyscale, Groq, Perplexity) serving millions of API completions per minute.',
      'Real-time conversational voice agents requiring sub-200ms Time-to-First-Token (TTFT) and high inter-token generation speed.'
    ],
    tradeOffs: [
      'Speculative decoding requires hosting both the draft model and target model in GPU VRAM, and yields lower speedup when generating highly creative, non-deterministic content.'
    ],
    followUpQuestions: [
      'How does Tensor Parallelism (Megatron-LM) split attention heads across GPUs, and why does it require high-bandwidth NVLink?',
      'How does Chunked Prefill prevent massive new prompt arrivals from stalling ongoing token generation steps?'
    ],
    relatedQuestionIds: ['ai-1', 'ai-3', 'sd-2'],
    tags: ['MLOps', 'vLLM', 'Inference', 'PagedAttention', 'LLMs', 'High Throughput'],
    keywords: ['vLLM', 'PagedAttention', 'Continuous Batching', 'KV Cache', 'Speculative Decoding', 'Inference'],
    companies: ['vLLM', 'Anyscale', 'OpenAI', 'Perplexity'],
    status: 'passed',
    statusLabel: 'Practiced 1x • High Score: 95%',
    isBookmarked: true
  }
];
