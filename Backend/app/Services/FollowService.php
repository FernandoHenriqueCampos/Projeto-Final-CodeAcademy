<?php

namespace App\Services;

use App\Exceptions\SelfFollowException;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class FollowService
{
    public function follow(User $follower, User $target): void
    {
        $this->rejectSelfTarget($follower, $target);

        $follower->following()->syncWithoutDetaching([$target->getKey()]);
    }

    public function unfollow(User $follower, User $target): void
    {
        $this->rejectSelfTarget($follower, $target);

        $follower->following()->detach($target->getKey());
    }

    public function isFollowing(User $follower, User $target): bool
    {
        return $follower->following()
            ->whereKey($target->getKey())
            ->exists();
    }

    public function followers(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->followers()
            ->orderBy('follows.created_at', 'desc')
            ->paginate($perPage);
    }

    public function following(User $user, int $perPage = 20): LengthAwarePaginator
    {
        return $user->following()
            ->orderBy('follows.created_at', 'desc')
            ->paginate($perPage);
    }

    private function rejectSelfTarget(User $follower, User $target): void
    {
        if ($follower->getKey() === $target->getKey()) {
            throw new SelfFollowException;
        }
    }
}
