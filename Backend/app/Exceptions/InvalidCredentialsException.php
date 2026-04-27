<?php

namespace App\Exceptions;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

class InvalidCredentialsException extends HttpException
{
    public function __construct(string $message = 'Invalid credentials.')
    {
        parent::__construct(Response::HTTP_UNAUTHORIZED, $message);
    }
}
