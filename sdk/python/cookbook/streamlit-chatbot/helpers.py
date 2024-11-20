def chunk_object(obj, chunk_size=1000, overlap=200):
    """
    Chunks the text property of an object into smaller pieces with overlap.
    
    Args:
        obj (dict): The input object containing properties including 'text'
        chunk_size (int): Maximum size of each chunk
        overlap (int): Number of characters to overlap between chunks
        
    Returns:
        list: List of objects with the same properties but chunked text
    """
    # If there's no text property or text is shorter than chunk_size, return original
    if 'text' not in obj or len(obj['text']) <= chunk_size:
        return [obj]
    
    text = obj['text']
    chunks = []
    start = 0
    
    while start < len(text):
        # Get chunk of text
        end = start + chunk_size
        
        # If this isn't the first chunk, include the overlap from the previous chunk
        if start > 0:
            start = start - overlap
            
        # Get the chunk
        chunk = text[start:end]
        
        # Create new object with same properties but chunked text
        new_obj = obj.copy()
        new_obj['text'] = chunk

        
        chunks.append(new_obj)
        
        # Move start position for next chunk
        start = end
    
    return chunks