<?php

namespace App\Services;

use App\Models\Post;
use App\Models\User;
use App\Support\DeletesPublicFiles;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

class PostService
{
    use DeletesPublicFiles;

    public function create(User $user, UploadedFile $image, ?string $caption): Post
    {
        $path = $image->store('posts', 'public');

        try {
            $post = DB::transaction(function () use ($caption, $path, $user): Post {
                $post = new Post(['caption' => $caption]);
                $post->forceFill(['image_url' => $path]);
                $post->user()->associate($user);
                $post->save();

                return $post;
            });
        } catch (Throwable $exception) {
            $this->deletePublicFileQuietly($path);

            throw $exception;
        }

        return $this->loadSummary($post, $user);
    }

    public function find(int $postId, ?User $viewer = null): Post
    {
        return Post::query()
            ->withSummary($viewer)
            ->findOrFail($postId);
    }

    public function update(Post $post, array $data, ?User $viewer = null): Post
    {
        $post->fill($data)->save();

        return $this->loadSummary($post->refresh(), $viewer);
    }

    public function delete(Post $post): void
    {
        $path = $post->getRawOriginal('image_url');

        $post->delete();

        $this->deletePublicFileQuietly($path);
    }

    public function listByUser(User $user, ?User $viewer = null, int $perPage = 15): LengthAwarePaginator
    {
        return $user->posts()
            ->withSummary($viewer)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    private function loadSummary(Post $post, ?User $viewer): Post
    {
        $post->loadMissing('user')
            ->loadCount(['likes', 'comments']);

        if ($viewer !== null) {
            $exists = $post->likes()
                ->where('user_id', $viewer->getKey())
                ->exists();

            $post->setAttribute('liked_by_me', $exists);
        }

        return $post;
    }
}
