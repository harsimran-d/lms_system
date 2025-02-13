"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  DraggableProvided,
  DroppableProvided,
  DropResult,
} from "@hello-pangea/dnd";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { PublishStatus } from "@/lib/db";
import axios from "axios";
import { Grip, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
interface ChaptersListProps {
  courseId: string;
  initialData: {
    chapters: {
      id: string;
      title: string;
      status: PublishStatus;
      sequence: number;
      isFree: boolean;
    }[];
  };
}

const getStatusClasses = (status: PublishStatus) => {
  switch (status) {
    case "DRAFT":
      return "bg-blue-200 text-blue-700";
    case "PUBLISHED":
      return "bg-green-200 text-green-700";
    case "ARCHIVED":
      return "bg-gray-200 text-gray-700";
    default:
      return "bg-white text-black";
  }
};
function reorder<TItem>(
  list: TItem[],
  startIndex: number,
  endIndex: number,
): TItem[] {
  const result = [...list];
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

const ChaptersList = ({ courseId, initialData }: ChaptersListProps) => {
  useEffect(() => {
    setChapters(initialData.chapters);
  }, [initialData.chapters]);
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [chapters, setChapters] = useState(initialData.chapters);
  const updateSequences = async (
    newSequences: {
      id: string;
      sequence: number;
    }[],
  ) => {
    setIsUpdating(true);
    try {
      const response = await axios.put(
        `/api/courses/${courseId}/chapter/reorder`,
        {
          list: newSequences,
        },
      );
      if (response.status == 200) {
        toast.success("Reorder successfull");
      } else {
        toast.error("Reordering courses failed");
      }
    } catch (e) {
      console.log(e);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
      router.refresh();
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const newChapters = reorder(
      chapters,
      result.source.index,
      result.destination.index,
    );
    setChapters(newChapters);
    const newSequences = newChapters.map((chapter, index) => ({
      id: chapter.id,
      sequence: index,
    }));
    updateSequences(newSequences);
  };
  return (
    <div className="relative rounded-md border bg-slate-100 p-6">
      {isUpdating && (
        <div className="rounded-m absolute left-0 top-0 flex h-full w-full items-center justify-center bg-slate-500/20 text-[color:hsl(30,100,50)]">
          <Loader2 className="animate-spin" />
        </div>
      )}
      {chapters.length === 0 ? (
        <p className="text-sm italic text-slate-400">
          Please add at least 1 chapter
        </p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="chapters">
            {(provided: DroppableProvided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {chapters.map((chapter, index) => {
                  return (
                    <Draggable
                      key={chapter.id}
                      draggableId={chapter.id}
                      index={index}
                    >
                      {(provided: DraggableProvided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="mb-2 flex flex-wrap items-center justify-between rounded-md bg-slate-200 px-2"
                        >
                          <div className="flex items-center space-x-1">
                            <div {...provided.dragHandleProps}>
                              <Grip className="h-4 w-4 text-slate-500" />
                            </div>

                            <p className="truncate">{chapter.title}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {chapter.isFree && (
                              <div className="rounded-xl bg-green-300 px-2 py-1 text-[10px]">
                                Free
                              </div>
                            )}
                            <div
                              className={cn(
                                "rounded-xl px-2 py-1 text-[8px]",
                                getStatusClasses(chapter.status),
                              )}
                            >
                              {chapter.status}
                            </div>
                            <Link
                              href={`/teacher/courses/${courseId}/chapters/${chapter.id}`}
                            >
                              <Button variant="ghost">Edit</Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          <p className="text-sm italic text-slate-400">
            Drag chapters to reorder
          </p>
        </DragDropContext>
      )}
    </div>
  );
};

export default ChaptersList;
