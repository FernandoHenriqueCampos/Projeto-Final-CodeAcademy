<?php

namespace App\Http\Controllers;

use App\Http\Resources\PostResource;
use App\Services\FeedService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class FeedController extends Controller
{
    public function __construct(private readonly FeedService $feedService) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return PostResource::collection(
            $this->feedService->feed($request->user(), $this->perPage($request)),
        );
    }
}
