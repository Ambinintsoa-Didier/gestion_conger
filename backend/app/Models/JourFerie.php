<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JourFerie extends Model
{
    use HasFactory;

    protected $primaryKey = 'idDate';
    
    protected $table = 'jour_feriers';

    protected $fillable = [
        'date',
        'description'
    ];

    protected $casts = [
        'date' => 'date',
    ];
}
