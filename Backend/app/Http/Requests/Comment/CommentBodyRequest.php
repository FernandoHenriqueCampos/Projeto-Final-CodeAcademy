<?php

namespace App\Http\Requests\Comment;

use Illuminate\Foundation\Http\FormRequest;

abstract class CommentBodyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:1', 'max:2200'],
        ];
    }
}
