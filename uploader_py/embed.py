import json
import os
import time
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from openai import OpenAI

import chromadb
from chromadb.api import ClientAPI
from chromadb.api.models.Collection import Collection
from collections import defaultdict

from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_core.documents import Document

# Load environment variables
load_dotenv()

class DocumentProcessor:
    def __init__(self, folder_to_embed: str):
        self.folder_to_embed = folder_to_embed
        
        # Initialize ChromaDB client
        self.client =  chromadb.CloudClient(
            api_key=os.getenv("CHROMA_API_KEY"),
            tenant=os.getenv("CHROMA_TENANT"),
            database=os.getenv("CHROMA_DATABASE")
        )
        
        # Initialize OpenAI embeddings
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )
        self.openAIClient =  OpenAI()
        
        # Initialize text splitter
        self.text_splitter = RecursiveCharacterTextSplitter(
            separators=["\n"],
            chunk_size=800,
            chunk_overlap=400
        )

    def load_and_chunk(self, file_path: str) -> List[Document]:
        """Load a file and chunk it into documents"""
        file_path = Path(file_path)
        
        # Choose appropriate loader based on file extension
        if file_path.suffix.lower() == '.pdf':
            loader = PyPDFLoader(str(file_path))
        elif file_path.suffix.lower() == '.docx':
            loader = Docx2txtLoader(str(file_path))
        elif file_path.suffix.lower() == '.txt':
            loader = TextLoader(str(file_path), encoding='utf-8')
        else:
            raise ValueError(f"Unsupported file type: {file_path.suffix}")
        
        # Load and extract text into documents
        docs = loader.load()
        
        # Chunk documents
        chunked_docs = self.text_splitter.split_documents(docs)
        
        for i in range(0, len(chunked_docs), 5):
            batch = chunked_docs[i:i+5]
            indexed_chunks = [
                {"chunk_index": i, "content": chunk.page_content}
                for i, chunk in enumerate(batch)
            ]
            gen_questions = self.generate_questions_for_chunks(indexed_chunks)
            for gen_question in gen_questions:
                batch[gen_question['chunk_index']].metadata['questions'] = gen_question['questions']  
            for chunk in batch:
                chunk.metadata['originalContent'] = chunk.page_content
                final_text = "Content:\n" + chunk.page_content + "\n\nQuestions:\n" + "\n".join(chunk.metadata['questions'])
                chunk.page_content = final_text
        return chunked_docs



    def generate_questions_for_chunks(self, chunks):
        """
        Takes a list of text chunks and returns a list of question arrays.
        Each element in the output corresponds to the same index in 'chunks'
        and contains 3 likely questions parents might type into a school chatbot to find this content.
        """
        

        prompt = f"""
        You are given the following JSON array of text chunks:

        {json.dumps(chunks, indent=2)}

        For each chunk, generate NO MORE THAN 3 concise user Questions parents might type into a school chatbot to find this content.
        Return only valid JSON with no markdown, no ```json fences, no commentary.
        If no questions can be generated, return an empty array.

        [
        {{"chunk_index": 0, "questions": ["Q1", "Q2", "Q3"]}},
        ...
        ]
        Do not add any commentary or Markdown.
        """

        full_input = prompt
        response = self.openAIClient.responses.create(
            model="gpt-4o-mini",
            input=full_input,
            temperature=0.3,
        )

        # Extract JSON text from response
        output_text = response.output_text.strip()

        try:
            questions = json.loads(output_text)
        except json.JSONDecodeError:
            raise ValueError("Model response was not valid JSON:\n" + output_text)
        
        return questions
    
    
    def get_new_id(self, file_name: str, chunk_id: int) -> str:
        """Generate a unique ID for each chunk"""
        timestamp = int(time.time() * 1000)  # milliseconds
        return f"{file_name}-{chunk_id}-{timestamp}"

    def process_folder_sync(self):
        """Synchronous version of the main processing function"""
        folder_path = Path(self.folder_to_embed)
        
        # Get all subdirectories
        folders = [f for f in folder_path.iterdir() if f.is_dir()]
        
        for folder in folders:
            print(f"Processing folder: {folder.name}")
            
            # Get all files in the folder (non-directories only)
            files = [f for f in folder.iterdir() if f.is_file()]
            
            # Create or get collection
            try:
                collection = self.client.get_or_create_collection(name=folder.name)
                print(f"Created/accessed collection: {folder.name}")
            except Exception as e:
                print(f"Error creating collection {folder.name}: {e}")
                continue
            
            for file in files:
                print(f"Processing file: {file.name}")
                
                try:
                    # Load and chunk the file
                    chunks = self.load_and_chunk(str(file))
                    
                    # Process each chunk
                    for chunk_index, chunk in enumerate(chunks):
                        chunk_id = chunk_index + 1
                        text = chunk.page_content
                        
                        # Generate embedding
                        embedding = self.embeddings.embed_query(text)
                        
                        # Generate unique ID
                        doc_id = self.get_new_id(file.name, chunk_id)
                        
                        # Add to collection
                        collection.add(
                            ids=[doc_id],
                            embeddings=[embedding],
                            documents=[text],
                            metadatas=[{"fileName": file.name, "questions":json.dumps(chunk.metadata.get('questions', [])), "originalContent": chunk.metadata.get('originalContent', '')}]
                        )
                        
                        print(f"Added chunk {chunk_id} from {file.name}")
                        
                except Exception as e:
                    print(f"Error processing file {file.name}: {e}")
                    continue
            
            print(f"Completed processing folder: {folder.name}")


def main():
    # Set your folder path here
    folder_to_embed = r"C:\\repos\\retns\\static"
    
    # Create processor instance
    processor = DocumentProcessor(folder_to_embed)
    
    # Run the processing (synchronous version)
    processor.process_folder_sync()
    
    print("Processing completed!")


if __name__ == "__main__":
    main()