<?php

namespace Database\Seeders;

use App\Models\Post;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostsSeeder extends Seeder
{
    public function run(): void
    {
        Storage::disk('public')->makeDirectory('posts');

        $demoCaptions = [
            'demo' => [
                'Primeiro dia testando o InstaClone. Feed pronto para explorar.',
                'Uma imagem demo para validar curtidas, comentarios e perfil.',
                'Postagem fixa da conta demo com dados reais de apresentacao.',
            ],
            'ana.martins' => [
                'Cafe forte, luz bonita e uma lista pequena de tarefas.',
                'Fim de tarde com camera na mao e tempo para reparar nos detalhes.',
                'Uma pausa rapida no centro antes de voltar ao trabalho.',
            ],
            'bruno.costa' => [
                'Treino cedo e projeto entregue antes do almoco.',
                'Bastidores de uma semana corrida, mas produtiva.',
                'Organizando ideias para o proximo sprint.',
            ],
            'carla.souza' => [
                'Nova planta na mesa e energia renovada no escritorio.',
                'Testando paletas e rabiscando fluxos de tela.',
                'Detalhes pequenos mudam completamente a composicao.',
            ],
            'diego.lima' => [
                'Rua cheia, luz baixa e uma foto que gostei muito.',
                'Playlist nova para caminhar pela cidade.',
                'Noite tranquila depois de um dia comprido.',
            ],
        ];

        User::all()->each(function (User $user) use ($demoCaptions) {
            $captions = $demoCaptions[$user->username] ?? null;

            if ($captions !== null) {
                foreach ($captions as $index => $caption) {
                    $createdAt = Carbon::now()->subDays(random_int(1, 20))->subMinutes(random_int(0, 600));

                    $post = Post::query()->firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'caption' => $caption,
                        ],
                        [
                            'image_url' => $this->createSeedImage($user->username, $index + 1),
                            'created_at' => $createdAt,
                            'updated_at' => $createdAt,
                        ],
                    );

                    $post->forceFill([
                        'created_at' => $post->created_at ?? $createdAt,
                        'updated_at' => $post->updated_at ?? $createdAt,
                    ])->save();
                }

                return;
            }

            if ($user->posts()->exists()) {
                $this->ensureImagesExist($user);

                return;
            }

            foreach ($this->captionsFor($user->username) as $index => $caption) {
                $createdAt = Carbon::now()->subDays(random_int(1, 25))->subMinutes(random_int(0, 720));
                $post = Post::query()->create([
                    'user_id' => $user->id,
                    'image_url' => $this->createSeedImage($user->username, $index + 1),
                    'caption' => $caption,
                ]);

                $post->forceFill([
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ])->save();
            }
        });
    }

    private function ensureImagesExist(User $user): void
    {
        $user->posts()->get()->each(function (Post $post) use ($user) {
            $path = $post->getRawOriginal('image_url');

            if ($path && Storage::disk('public')->exists($path)) {
                return;
            }

            $post->forceFill([
                'image_url' => $this->createSeedImage($user->username, $post->id),
            ])->save();
        });
    }

    private function createSeedImage(string $username, int $index): string
    {
        $filename = 'posts/seed-'.Str::slug($username).'-'.$index.'.svg';
        $theme = $this->themeFor($username, $index);

        Storage::disk('public')->put($filename, <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="Seed post image">
  <rect width="1200" height="900" fill="{$theme['background']}"/>
  <circle cx="980" cy="140" r="180" fill="{$theme['accent']}" opacity="0.35"/>
  <circle cx="180" cy="760" r="220" fill="{$theme['secondary']}" opacity="0.28"/>
  <path d="M0 620 C220 520 360 720 570 600 C780 480 930 560 1200 430 L1200 900 L0 900 Z" fill="{$theme['foreground']}" opacity="0.5"/>
  <text x="80" y="150" fill="#ffffff" font-family="Arial, sans-serif" font-size="58" font-weight="700">@{$username}</text>
  <text x="80" y="225" fill="#ffffff" font-family="Arial, sans-serif" font-size="34" opacity="0.88">InstaClone demo #{$index}</text>
</svg>
SVG);

        return $filename;
    }

    /**
     * @return array<int, string>
     */
    private function captionsFor(string $username): array
    {
        $templates = [
            'Dia comum, mas com uma luz bonita no caminho.',
            'Guardando este momento no feed para lembrar depois.',
            'Pequena pausa entre uma tarefa e outra.',
            'Um registro simples de uma semana boa.',
        ];

        $offset = crc32($username) % count($templates);

        return [
            $templates[$offset],
            $templates[($offset + 1) % count($templates)],
        ];
    }

    /**
     * @return array{background: string, foreground: string, accent: string, secondary: string}
     */
    private function themeFor(string $username, int $index): array
    {
        $themes = [
            ['background' => '#0f766e', 'foreground' => '#14b8a6', 'accent' => '#f59e0b', 'secondary' => '#e11d48'],
            ['background' => '#1d4ed8', 'foreground' => '#60a5fa', 'accent' => '#f97316', 'secondary' => '#22c55e'],
            ['background' => '#7c2d12', 'foreground' => '#fb923c', 'accent' => '#06b6d4', 'secondary' => '#facc15'],
            ['background' => '#334155', 'foreground' => '#64748b', 'accent' => '#ef4444', 'secondary' => '#10b981'],
            ['background' => '#831843', 'foreground' => '#ec4899', 'accent' => '#84cc16', 'secondary' => '#38bdf8'],
        ];

        return $themes[(crc32($username) + $index) % count($themes)];
    }
}
