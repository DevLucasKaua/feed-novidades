CREATE TABLE "clientes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "clientes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clientes_email_unico" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "lojas" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lojas_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"nome" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "novidades" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "novidades_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"loja_id" bigint NOT NULL,
	"texto" text NOT NULL,
	"preco" numeric(12, 2),
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "novidades_texto_tamanho" CHECK (char_length("novidades"."texto") between 1 and 500),
	CONSTRAINT "novidades_preco_positivo" CHECK ("novidades"."preco" > 0)
);
--> statement-breakpoint
CREATE TABLE "seguindo" (
	"cliente_id" bigint NOT NULL,
	"loja_id" bigint NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seguindo_pk" PRIMARY KEY("cliente_id","loja_id")
);
--> statement-breakpoint
ALTER TABLE "novidades" ADD CONSTRAINT "novidades_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguindo" ADD CONSTRAINT "seguindo_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seguindo" ADD CONSTRAINT "seguindo_loja_id_lojas_id_fk" FOREIGN KEY ("loja_id") REFERENCES "public"."lojas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "novidades_loja_recentes_idx" ON "novidades" USING btree ("loja_id","criado_em" desc,"id" desc);