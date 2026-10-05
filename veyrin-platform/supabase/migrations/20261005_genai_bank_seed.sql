-- Veyrin: make sure the ₹199 GenAI India interview bank has real questions.
insert into public.courses (slug,title,description,role,level,duration,price,cover_emoji,published,featured)
values ('genai-engineer-interview-bank-india','GenAI Engineer Interview Question Bank — India','A focused, practical interview bank for GenAI Engineer roles across Indian product and IT companies. RAG, LLMs, agents, evaluation, Python and system design.','GenAI Engineer','Intermediate → Advanced','Self paced',199,'₹',true,true)
on conflict (slug) do update set title=excluded.title, price=excluded.price, published=true, featured=true;

insert into public.questions (course_id,category,role,difficulty,question,answer,tags)
select c.id, v.category, 'GenAI Engineer', v.difficulty, v.question, v.answer, v.tags
from public.courses c
cross join (values
('RAG','Hard','Design a production RAG system for a large Indian enterprise. How would you control hallucinations, retrieval quality and sensitive data?','Cover hybrid retrieval, chunking, metadata filters, reranking, access-aware retrieval, grounded generation, citations, PII controls, evaluation datasets, observability and safe fallbacks.',array['rag','security','system-design']),
('LLM','Hard','An LLM application is accurate in offline testing but fails after deployment. How would you diagnose the issue?','Separate retrieval, prompt, model, tool and data-drift failures. Trace production requests, inspect retrieved context, compare online/offline distributions, slice failures and add regression tests.',array['llm','debugging','observability']),
('RAG','Hard','Your RAG retriever finds the correct document but the model still gives the wrong answer. What would you investigate?','Check chunk boundaries, ranking position, context ordering, context-window pressure, prompt grounding instructions, conflicting passages and whether the generator is using retrieved evidence.',array['rag','retrieval','prompting']),
('Embeddings','Medium','How would you choose an embedding model for an enterprise GenAI application used across English and Indian-language content?','Evaluate language coverage, domain similarity, retrieval quality, latency, dimensionality and licensing on a representative multilingual query-document benchmark.',array['embeddings','multilingual','evaluation']),
('Vector DB','Hard','When would you use hybrid search instead of pure vector search in a production RAG application?','Use hybrid search when exact terms, IDs, product names, error codes or domain vocabulary matter alongside semantic similarity. Combine lexical and dense retrieval and evaluate ranking.',array['vector-db','hybrid-search','retrieval']),
('Agents','Hard','How would you prevent an agent from making an unsafe tool call in production?','Use allowlisted tools, strict schemas, authorization checks, argument validation, guardrails, human approval for high-impact actions, timeouts, audit logs and least-privilege credentials.',array['agents','security','guardrails']),
('Evaluation','Hard','How would you evaluate a RAG system before deploying it to a large enterprise?','Build a versioned evaluation set and measure retrieval recall, answer correctness, groundedness, citation quality, refusal behavior, latency, cost and failure rates across important user segments.',array['evaluation','rag','metrics']),
('Python','Medium','A Python service calling an LLM becomes slow when traffic increases. What changes would you consider first?','Profile the request path, reuse HTTP clients, add async/concurrency where appropriate, batch compatible work, stream responses, cache deterministic results and control retries and rate limits.',array['python','performance','llm']),
('System Design','Hard','Design a multi-tenant GenAI platform where each customer must only retrieve its own documents.','Enforce tenant identity at authentication and authorization boundaries, store tenant metadata with documents, apply server-side retrieval filters and prevent client-controlled tenant IDs.',array['system-design','multi-tenant','security']),
('Indian Interviews','Hard','Why should we hire you as a GenAI Engineer instead of a prompt engineer?','Show end-to-end engineering: data and retrieval pipelines, model selection, evaluation, backend APIs, security, observability, deployment, cost/latency trade-offs and production reliability.',array['interview','career','system-design'])
) as v(category,difficulty,question,answer,tags)
where c.slug='genai-engineer-interview-bank-india'
and not exists (select 1 from public.questions q where q.course_id=c.id and q.question=v.question);

notify pgrst, 'reload schema';
