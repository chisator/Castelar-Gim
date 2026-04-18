"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, Square, Timer, RotateCcw, ChevronDown, ChevronUp, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { toast } from "sonner"

export function WorkoutTimer() {
    const [isOpen, setIsOpen] = useState(false)
    const [time, setTime] = useState(0)
    const [isActive, setIsActive] = useState(false)
    const [mode, setMode] = useState<"stopwatch" | "timer">("stopwatch")
    const [presetTime, setPresetTime] = useState(60) // Default 60s for timer
    const [isMuted, setIsMuted] = useState(false)

    // Base64 beep sound (generated: 0.5s 880Hz sine wave)
    const BEEP_URL = "data:audio/wav;base64,UklGRkZWAABXQVZFZm10IBAAAAABAAEARKwAAESsAAABAAgAZGF0YSJWAACAhoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3mAhoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3l/hoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3mAhoySmJ2ipqqtr7GxsbGvraqmop2YkoyGgHpzbWhiXllWUlBOTk5OUFJVWV1iZ2xyeX+Fi5GXnKGmqayvsLGxsa+tqqeinpiTjYeBenRuaGNeWlZTUE9OTk5QUlVYXGFmbHJ4foSLkZacoaWprK+wsbGxsK2rp6OemZSOiIF7dW9pZF9aVlNRT05OTk9RVFhcYGZrcXd9hIqQlpugpaisrrCxsbGwrquoo5+alI6Ignx2b2pkX1tXU1FPTk5OT1FUV1tgZWtwdn2DiY+VmqCkqKuusLGxsbCuq6ikn5qVj4mDfHZwamVgW1dUUU9OTk5PUVRXW19kanB2fIKIj5San6Soq66wsbGxsK6sqKSgm5WQioN9d3FrZWBcWFRRT05OTk9RU1ZaX2Rpb3V7gYiOlJmeo6errrCxsbGwrqyppaCblpCKhH54cmxmYVxYVFJQTk5OT1BTVlpeY2ludHuBh42TmZ6jp6qtr7GxsbCvrKmloZyXkYuFf3hybGdhXVhVUlBOTk5PUFNWWV5jaG50eoCGjJKYnaKmqq2vsbGxsa+tqqainZeSjIZ/eXNtZ2JdWVVSUE5OTk5QUlVZXWJnbXN5f4aMkpedoqaqra+xsbGxr62qpqKdmJKMhoB6dG5oY15ZVlNQT05OTlBSVVhdYWdscnh/hYuRl5yhpamsr7CxsbGvraqno56Zk42HgXp0bmljXlpWU1BPTk5OUFJVWFxhZmxyeH6EipCWnKGlqayusLGxsbCtq6ejnpmUjoiBe3VvaWRfWlZTUU9OTk5PUVRYXGBla3F3fYOKkJaboKSorK6wsbGxsK6rqKSfmpSOiIJ8dnBqZF9bV1RRT05OTk9RVFdbYGVqcHZ9g4mPlZqfpKirrrCxsbGwrquopJ+alY+Jg312cGplYFtXVFFPTk5OT1FTV1tfZGpwdnyCiI6Ump+jqKuusLGxsbCurKiloJuWkIqEfXdxa2ZgXFhUUU9OTk5PUVNWWl9kaW91e4GIjpSZnqOnq62wsbGxsK+sqaWhnJaQioR+eHJsZmFcWFVSUE5OTk9QU1ZaXmNobnR6gYeNk5meoqeqra+xsbGwr6yppaGcl5GLhX94cmxnYl1ZVVJQTk5OTlBSVlleY2hudHqAhoySmJ2ipqqtr7GxsbGvraqmop2XkoyGf3lzbWdiXVlVUlBOTk5OUFJVWV1iZ21zeX+FjJKXnaGmqq2vsbGxsa+tqqainZiSjYaAenRuaGNeWVZTUE9OTk5QUlVYXWFnbHJ4f4WLkZecoaWprK+wsbGxr62qp6OemZONh4F7dG5pY15aVlNQT05OTk9SVFhcYWZscXh+hIqQlpugpamsrrCxsbGwrquno56ZlI6Ignt1b2lkX1pWU1FPTk5OT1FUWFxgZWtxd32DipCVm6CkqKyusLGxsbCuq6ikn5qUj4iCfHZwamRfW1dUUU9OTk5PUVRXW2BlanB2fIOJj5Wan6Soq66wsbGxsK6rqKSgm5WPiYN9d3BrZWBbV1RRT05OTk9RU1dbX2Rqb3V8goiOlJqfo6errrCxsbGwrqyppaCblpCKhH13cWtmYVxYVFFPTk5OT1FTVlpfZGlvdXuBh46TmZ6jp6utsLGxsbCvrKmloZyWkYuEfnhybGZhXFhVUlBOTk5PUFNWWl5jaG50eoCHjZOYnqKnqq2vsbGxsK+sqaahnJeRi4V/eXJtZ2JdWVVSUE5OTk5QUlVZXmJobXN6gIaMkpidoqaqra+xsbGxr62qpqKdmJKMhoB5c21oYl1ZVVJQTk5OTlBSVVldYmdtc3l/hYuRl5yhpqmtr7GxsbGvraqmop2Yk42HgHp0bmhjXlpWU1BPTk5OUFJVWF1hZmxyeH6Fi5GXnKGlqayvsLGxsa+tqqejnpmTjYeBe3VvaWNeWlZTUE9OTk5PUlRYXGFma3F3foSKkJaboKWprK6wsbGxsK6rp6OfmZSOiIJ7dW9pZF9aV1NRT05OTk9RVFdcYGVrcXd9g4mPlZugpKisrrCxsbGwrquopJ+alY+Jgnx2cGplYFtXVFFPTk5OT1FUV1tgZWpwdnyCiY+Vmp+kqKuusLGxsbCuq6ikoJuVj4mDfXdxa2VgW1dUUU9OTk5PUVNXW19kaW91fIKIjpSan6Onq66wsbGxsK6sqaWgm5aQioR+d3FrZmFcWFRST05OTk9RU1ZaXmNpb3V7gYeNk5meo6eqra+xsbGwr6yppaGclpGLhX54cmxmYVxYVVJQTk5OT1BTVlpeY2hudHqAh42TmJ6ip6qtr7GxsbCvrKmmoZyXkYuFf3lzbWdiXVlVUlBOTk5OUFJVWV1iaG1zeYCGjJKYnaKmqq2vsbGxsa+tqqainZiSjIaAeXNtaGJdWVVSUE5OTk5QUlVZXWJnbXN5f4WLkZecoaaprK+wsbGxr62qp6KemJONh4B6dG5oY15aVlNQT05OTlBSVVhcYWZscnh+hIuRlpyhpamsr7CxsbGvrauno56Zk42HgXt1b2lkX1pWU1FPTk5OT1FUWFxhZmtxd36EipCWm6ClqayusLGxsbCuq6ejn5qUjoiCfHVvamRfW1dTUU9OTk5PUVRXW2Bla3B3fYOJj5WboKSoq66wsbGxsK6rqKSfmpWPiYN8dnBqZWBbV1RRT05OTk9RVFdbX2VqcHZ8gomPlJqfpKirrrCxsbGwrqyopKCblZCJg313cWtlYFxXVFFPTk5OT1FTV1pfZGlvdXuCiI6UmZ+jp6uusLGxsbCurKmloJuWkIqEfndxa2ZhXFhUUk9OTk5PUFNWWl5jaW50e4GHjZOZnqOnqq2vsbGxsK+sqaWhnJeRi4V+eHJsZ2FdWFVSUE5OTk9QU1ZZXmNobnR6gIaNk5idoqaqra+xsbGxr62ppqGdl5KMhX95c21nYl1ZVVJQTk5OTlBSVVldYmdtc3k="

    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        audioRef.current = new Audio(BEEP_URL)
        // IN REALITY I WILL USE THE FILE CONTENT
    }, [])

    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const playAlarm = () => {
        if (!audioRef.current) return

        // Vibración (siempre vibra, es útil)
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(500)
        }

        if (isMuted) return

        // Play 1 time
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(e => console.error("Play error:", e))
    }

    // Effect to handle timer countdown
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => {
                    if (mode === "timer") {
                        if (prevTime <= 0) {
                            return 0
                        }
                        return prevTime - 1
                    }
                    return prevTime + 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [isActive, mode])

    // Effect to handle timer completion
    useEffect(() => {
        if (mode === "timer" && time === 0 && isActive) {
            setIsActive(false)
            playAlarm()
            toast("¡Tiempo terminado!", {
                description: "El temporizador ha llegado a cero.",
                duration: 5000,
                action: {
                    label: "Reiniciar",
                    onClick: () => {
                        setTimerMode(presetTime)
                        setIsActive(true)
                    }
                }
            })
        }
    }, [time, isActive, mode, presetTime])

    const toggleTimer = () => {
        if (!isActive) {
            if (audioRef.current) {
                // Unlock audio context on mobile
                audioRef.current.play().then(() => {
                    if (audioRef.current) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                    }
                }).catch(() => { });
            }
        }
        setIsActive(!isActive)
    }

    const resetTimer = () => {
        setIsActive(false)
        setTime(mode === "timer" ? presetTime : 0)
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const setTimerMode = (duration: number) => {
        setMode("timer")
        setPresetTime(duration)
        setTime(duration)
        setIsActive(false)
    }

    const setStopwatchMode = () => {
        setMode("stopwatch")
        setTime(0)
        setIsActive(false)
    }

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    // Use createPortal to ensure the timer is outside the stacking context of the main app flow
    // and can compete properly with Dialogs (which are also ported).
    // Usually Dialogs have z-50. We use z-[100] to stay on top.
    const content = (
        <div
            id="workout-timer-container"
            className="fixed bottom-20 md:bottom-4 right-4 z-40 flex flex-col items-end gap-2 isolate pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {isOpen && (
                <Card className="w-64 shadow-xl border-2 border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300 bg-background/95 backdrop-blur-sm">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center bg-muted p-1 rounded-lg">
                            <Button
                                variant={mode === "stopwatch" ? "default" : "ghost"}
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={setStopwatchMode}
                            >
                                Cronómetro
                            </Button>
                            <Button
                                variant={mode === "timer" ? "default" : "ghost"}
                                size="sm"
                                className="h-7 text-xs flex-1"
                                onClick={() => setTimerMode(60)}
                            >
                                Temporizador
                            </Button>
                        </div>

                        <div className="absolute top-2 right-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => setIsMuted(!isMuted)}
                            >
                                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                        </div>

                        <div className="text-center">
                            <div className="text-5xl font-mono font-bold tracking-wider tabular-nums">
                                {formatTime(time)}
                            </div>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                variant={isActive ? "secondary" : "default"}
                                size="icon"
                                className="h-12 w-12 rounded-full"
                                onClick={toggleTimer}
                            >
                                {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                            </Button>
                            <Button variant="outline" size="icon" className="h-12 w-12 rounded-full" onClick={resetTimer}>
                                {isActive ? <Square className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
                            </Button>
                        </div>

                        {mode === "timer" && (
                            <div className="grid grid-cols-3 gap-1">
                                {[30, 60, 90, 120, 180, 300].map(sec => (
                                    <Button
                                        key={sec}
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7"
                                        onClick={() => {
                                            setTimerMode(sec)
                                            setIsActive(true) // Auto start on preset click? Optional.
                                        }}
                                    >
                                        {sec < 60 ? `${sec}s` : `${sec / 60}m`}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Button
                size="lg"
                className={cn(
                    "rounded-full shadow-lg h-14 px-6 gap-2 transition-all",
                    isOpen ? "bg-primary text-primary-foreground" : "bg-primary hover:bg-primary/90"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Timer className="h-6 w-6" />
                <span className="font-bold text-lg tabular-nums">
                    {isActive ? formatTime(time) : isOpen ? "Ocultar" : "Timer"}
                </span>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
        </div>
    )

    // Using a portal allows this to float above everything else including Dialogs
    if (typeof document !== "undefined") {
        import("react-dom").then(ReactDOM => {
            // This is just for type safety, the dynamic import handles it
        })
    }

    // Since we are in client component, we can use createPortal directly if we import it
    const { createPortal } = require("react-dom")
    return createPortal(content, document.body)
}
