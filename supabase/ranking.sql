-- Turtle Race: ranking das turmas 5A e 5B.
-- Como usar: no painel do Supabase, abra "SQL Editor", cole este arquivo inteiro e clique em "Run".
-- Pode rodar de novo sem perder os dados.

create table if not exists public.ranking (
  id            bigint generated always as identity primary key,
  nome          text not null check (char_length(nome) between 3 and 40),
  nome_chave    text not null,                       -- nome em minúsculas, para não duplicar o aluno
  turma         text not null check (turma in ('5A', '5B')),
  pontos        integer not null check (pontos between 0 and 1000000),
  voltas        integer not null check (voltas between 0 and 1000),
  atualizado_em timestamptz not null default now(),
  unique (turma, nome_chave)
);

-- Limites de pontos e voltas (atualiza tabelas criadas com o limite antigo de 20.000 pontos).
alter table public.ranking drop constraint if exists ranking_pontos_check;
alter table public.ranking add constraint ranking_pontos_check check (pontos between 0 and 1000000);
alter table public.ranking drop constraint if exists ranking_voltas_check;
alter table public.ranking add constraint ranking_voltas_check check (voltas between 0 and 1000);

-- Segurança: o jogo (chave "anon") só pode LER o ranking.
-- Ninguém insere, altera ou apaga direto na tabela; só pela função abaixo.
alter table public.ranking enable row level security;

drop policy if exists "ranking: leitura publica" on public.ranking;
create policy "ranking: leitura publica" on public.ranking
  for select to anon, authenticated using (true);

revoke all on public.ranking from anon, authenticated;
grant select on public.ranking to anon, authenticated;

-- Envia a pontuação de uma corrida. Guarda só a MELHOR pontuação de cada aluno:
-- se a nova for menor ou igual, nada muda.
create or replace function public.enviar_pontuacao(p_nome text, p_turma text, p_pontos integer, p_voltas integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nome text := regexp_replace(btrim(coalesce(p_nome, '')), '\s+', ' ', 'g');
begin
  if char_length(v_nome) < 3 or char_length(v_nome) > 40 then
    raise exception 'nome invalido';
  end if;
  if p_turma is null or p_turma not in ('5A', '5B') then
    raise exception 'turma invalida';
  end if;
  if p_pontos is null or p_pontos < 0 or p_pontos > 1000000 then
    raise exception 'pontuacao invalida';
  end if;
  if p_voltas is null or p_voltas < 0 or p_voltas > 1000 then
    raise exception 'voltas invalidas';
  end if;

  insert into public.ranking (nome, nome_chave, turma, pontos, voltas)
  values (v_nome, lower(v_nome), p_turma, p_pontos, p_voltas)
  on conflict (turma, nome_chave) do update
    set pontos = excluded.pontos,
        voltas = excluded.voltas,
        nome = excluded.nome,
        atualizado_em = now()
    where excluded.pontos > public.ranking.pontos;
end;
$$;

revoke all on function public.enviar_pontuacao(text, text, integer, integer) from public;
grant execute on function public.enviar_pontuacao(text, text, integer, integer) to anon, authenticated;

-- Para zerar o ranking (por exemplo, no começo de um bimestre), rode só esta linha:
--   truncate table public.ranking;
-- Para apagar um registro errado:
--   delete from public.ranking where turma = '5A' and nome_chave = 'nome do aluno em minusculas';
