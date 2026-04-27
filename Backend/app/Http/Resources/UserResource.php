<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    private bool $includeEmail = false;

    public function withEmail(): self
    {
        $this->includeEmail = true;

        return $this;
    }

    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'bio' => $this->bio,
            'avatar_url' => $this->avatar_url,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];

        if ($this->includeEmail || $request->user()?->getKey() === $this->resource->getKey()) {
            $data['email'] = $this->resource->getAttribute('email');
        }

        return $data;
    }
}
